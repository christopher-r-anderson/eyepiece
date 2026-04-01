import { describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import {
  getInfiniteSearchImagesOptions,
  prefetchInfiniteSearch,
} from './search.queries'
import type { SearchRepo } from './search.repo'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { DEFAULT_PAGE_SIZE } from '@/domain/pagination/pagination.schema'

const query = 'apollo'
const filters = {
  providerId: NASA_IVL_PROVIDER_ID,
  filters: { mediaType: 'image' as const },
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
