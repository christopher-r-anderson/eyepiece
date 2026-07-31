import { describe, expect, it, vi } from 'vitest'
import { QueryClient, hashKey } from '@tanstack/react-query'
import {
  getInfiniteSearchImagesOptions,
  makeTopNSearchSelector,
  prefetchInfiniteSearch,
} from './search.queries'
import { toSearchPageState } from './search-page-params'
import type { SearchRepo } from './search.repo'
import type { SearchFilters } from '@/domain/search/search.schema'
import {
  NASA_IVL_PROVIDER_ID,
  PROVIDERS,
} from '@/domain/provider/provider.schema'
import { DEFAULT_PAGE_SIZE } from '@/domain/pagination/pagination.schema'

const query = 'apollo'
const filters = {
  providerId: NASA_IVL_PROVIDER_ID,
  filters: { yearStart: 2000 },
} as const

describe('getInfiniteSearchImagesOptions', () => {
  it('requests page 1 by default with the configured page size', async () => {
    const searchImages = vi.fn().mockResolvedValue({
      items: [],
      pagination: { next: null, total: 0 },
    })
    const repo: SearchRepo = { searchImages }

    const options = getInfiniteSearchImagesOptions({ repo, query, filters })
    await (options.queryFn as any)({})

    expect(searchImages).toHaveBeenCalledWith(query, filters, {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    })
  })

  it('requests the provided pageParam for subsequent pages', async () => {
    const searchImages = vi.fn().mockResolvedValue({
      items: [],
      pagination: { next: null, total: 0 },
    })
    const repo: SearchRepo = { searchImages }

    const options = getInfiniteSearchImagesOptions({ repo, query, filters })
    await (options.queryFn as any)({ pageParam: 3 })

    expect(searchImages).toHaveBeenCalledWith(query, filters, {
      page: 3,
      pageSize: DEFAULT_PAGE_SIZE,
    })
  })

  it('uses pagination.next as the next page param', () => {
    const repo: SearchRepo = {
      searchImages: vi.fn() as any,
    }
    const options = getInfiniteSearchImagesOptions({ repo, query, filters })

    const next = (options.getNextPageParam as any)({
      pagination: { next: 4, total: 77 },
    })

    expect(next).toBe(4)
  })
})

describe('prefetchInfiniteSearch', () => {
  it('prefetches using the provided client and stores the first page', async () => {
    const searchAssets = vi.fn().mockResolvedValue({
      items: [],
      pagination: { next: null, total: 0 },
    })
    const queryClient = new QueryClient()

    await prefetchInfiniteSearch({
      query,
      filters,
      eyepieceClient: { searchAssets } as any,
      queryClient,
    })

    expect(searchAssets).toHaveBeenCalledWith(query, filters, {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    })

    const options = getInfiniteSearchImagesOptions({
      repo: { searchImages: searchAssets },
      query,
      filters,
    })
    const cached = queryClient.getQueryData(options.queryKey)

    expect(cached?.pages).toHaveLength(1)
    expect(cached?.pages[0]?.pagination.total).toBe(0)
  })
})

describe('makeTopNSearchSelector', () => {
  const asset = (externalId: string) => ({ key: { externalId } }) as any

  it('slices the first page to n and surfaces the total', () => {
    const select = makeTopNSearchSelector(2)

    expect(
      select({
        pages: [
          {
            items: [asset('a'), asset('b')],
            pagination: { next: '2', total: 40 },
          },
          {
            items: [asset('c')],
            pagination: { next: null, total: 40 },
          },
        ],
        pageParams: ['1', '2'],
      }),
    ).toEqual({ items: [asset('a'), asset('b')], total: 40 })
  })

  it('returns fewer items when the first page is short', () => {
    const select = makeTopNSearchSelector(6)

    expect(
      select({
        pages: [{ items: [asset('a')], pagination: { next: null, total: 1 } }],
        pageParams: ['1'],
      }),
    ).toEqual({ items: [asset('a')], total: 1 })
  })
})

describe('section and scoped-tab query key parity', () => {
  // any drift here reintroduces a double fetch on "See all"
  const repo: SearchRepo = { searchImages: vi.fn() as any }

  it.each(PROVIDERS)('matches for %s default filters', (providerId) => {
    const sectionFilters: SearchFilters = { providerId, filters: {} }
    const { scope } = toSearchPageState({ q: 'moon', providerId })
    if (scope.scope !== 'provider') throw new Error('expected provider scope')

    const sectionKey = getInfiniteSearchImagesOptions({
      repo,
      query: 'moon',
      filters: sectionFilters,
    }).queryKey
    const scopedTabKey = getInfiniteSearchImagesOptions({
      repo,
      query: 'moon',
      filters: scope.filters,
    }).queryKey

    expect(hashKey(sectionKey)).toBe(hashKey(scopedTabKey))
  })
})
