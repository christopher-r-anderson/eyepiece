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

function loaderContext() {
  return {
    eyepieceClient: { request: vi.fn() },
    queryClient: { prefetchInfiniteQuery: vi.fn() },
  }
}

describe('search page route', () => {
  beforeEach(() => {
    mockPrefetchInfiniteSearch.mockReset()
    mockPrefetchInfiniteSearch.mockResolvedValue(undefined)
  })

  it('canonicalizes loaderDeps and strips params owned by parent routes', () => {
    const deps = route.loaderDeps({
      search: {
        q: 'mars',
        providerId: SI_OA_PROVIDER_ID,
        auth: 'login',
        fp: 1,
      },
    })

    expect(deps).toEqual({
      q: 'mars',
      providerId: SI_OA_PROVIDER_ID,
    })
  })

  it.each([
    [{ q: '' }],
    [{ q: '   ' }],
    [{ q: '', providerId: NASA_IVL_PROVIDER_ID }],
  ])('skips prefetching for the prompt state %j', async (deps) => {
    await route.loader({ context: loaderContext(), deps })

    expect(mockPrefetchInfiniteSearch).not.toHaveBeenCalled()
  })

  it('skips prefetching for the all-providers scope', async () => {
    await route.loader({ context: loaderContext(), deps: { q: 'moon' } })

    expect(mockPrefetchInfiniteSearch).not.toHaveBeenCalled()
  })

  it('prefetches infinite search with nested domain filters for a provider scope', async () => {
    const context = loaderContext()

    await route.loader({
      context,
      deps: {
        q: 'apollo',
        providerId: NASA_IVL_PROVIDER_ID,
        mediaType: 'video',
        yearStart: 2000,
      },
    })

    expect(mockPrefetchInfiniteSearch).toHaveBeenCalledWith({
      query: 'apollo',
      filters: {
        providerId: NASA_IVL_PROVIDER_ID,
        filters: { mediaType: 'video', yearStart: 2000 },
      },
      eyepieceClient: context.eyepieceClient,
      queryClient: context.queryClient,
    })
  })

  it('builds a title from the search query for the all scope', () => {
    const head = route.head({
      match: { search: { q: 'apollo' } },
    })

    expect(head.meta).toEqual([{ title: 'Eyepiece | Search for "apollo"' }])
  })

  it('appends the provider label to the title for a provider scope', () => {
    const head = route.head({
      match: { search: { q: 'apollo', providerId: NASA_IVL_PROVIDER_ID } },
    })

    expect(head.meta).toEqual([
      { title: 'Eyepiece | Search for "apollo" – NASA' },
    ])
  })

  it('builds a generic title without a search query', () => {
    const head = route.head({
      match: { search: { q: '' } },
    })

    expect(head.meta).toEqual([{ title: 'Eyepiece | Search' }])
  })

  it('extracts providerId for error capture from a provider-scoped raw search', () => {
    expect(
      getSearchErrorProviderId({
        q: 'apollo',
        providerId: NASA_IVL_PROVIDER_ID,
      }),
    ).toBe(NASA_IVL_PROVIDER_ID)
  })

  it('returns no providerId for an unscoped or salvaged raw search', () => {
    expect(
      getSearchErrorProviderId({
        q: 123,
        providerId: 'not-a-provider',
      }),
    ).toBeUndefined()
  })
})
