import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal()
  return Object.assign({}, actual as object, {
    createFileRoute: () => (config: unknown) => config,
    CatchBoundary: ({ children }: { children: unknown }) => children,
  })
})

const mockPrefetchInfiniteSearch = vi.fn()
vi.mock('@/features/search/search.queries', () => ({
  prefetchInfiniteSearch: mockPrefetchInfiniteSearch,
}))

vi.mock('@/lib/utils', () => ({
  getTitleText: (title: string) => `Eyepiece | ${title}`,
}))

const { Route, getSearchErrorProviderId } = await import('./search')
const route = Route as any

describe('search page route', () => {
  beforeEach(() => {
    mockPrefetchInfiniteSearch.mockReset()
    mockPrefetchInfiniteSearch.mockResolvedValue(undefined)
  })

  it('rejects provider-incompatible filters in loader', async () => {
    await expect(
      route.loader({
        context: {
          eyepieceClient: { request: vi.fn() },
          queryClient: { prefetchInfiniteQuery: vi.fn() },
        },
        deps: {
          q: 'moon',
          providerId: SI_OA_PROVIDER_ID,
          filters: { mediaType: 'image' },
        },
      }),
    ).rejects.toThrow()
  })

  it('uses search as loaderDeps', () => {
    const deps = route.loaderDeps({
      search: { q: 'mars', providerId: SI_OA_PROVIDER_ID, filters: {} },
    })

    expect(deps).toEqual({
      q: 'mars',
      providerId: SI_OA_PROVIDER_ID,
      filters: {},
    })
  })

  it('prefetches infinite search with parsed query and filters', async () => {
    const eyepieceClient = { request: vi.fn() }
    const queryClient = { prefetchInfiniteQuery: vi.fn() }

    await route.loader({
      context: { eyepieceClient, queryClient },
      deps: {
        q: 'apollo',
        providerId: NASA_IVL_PROVIDER_ID,
        filters: {
          mediaType: 'video',
          yearStart: '2000',
        },
      },
    })

    expect(mockPrefetchInfiniteSearch).toHaveBeenCalledWith({
      query: 'apollo',
      filters: {
        providerId: NASA_IVL_PROVIDER_ID,
        filters: { mediaType: 'video', yearStart: 2000 },
      },
      eyepieceClient,
      queryClient,
    })
  })

  it('builds a title from the search query', () => {
    const head = route.head({
      match: { search: { q: 'apollo' } },
    })

    expect(head.meta).toEqual([{ title: 'Eyepiece | Search for "apollo"' }])
  })

  it('extracts providerId for error capture when raw search is valid', () => {
    expect(
      getSearchErrorProviderId({
        q: 'apollo',
        providerId: NASA_IVL_PROVIDER_ID,
        filters: {},
      }),
    ).toBe(NASA_IVL_PROVIDER_ID)
  })

  it('returns no providerId for invalid raw search state', () => {
    expect(
      getSearchErrorProviderId({
        q: 123,
        providerId: 'not-a-provider',
      }),
    ).toBeUndefined()
  })
})
