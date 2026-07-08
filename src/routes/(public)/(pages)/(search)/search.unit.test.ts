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

const { Route, getSearchErrorProviderId, validateSearchPageParams } =
  await import('./search')
const route = Route as any

describe('validateSearchPageParams', () => {
  it('passes valid provider filters through', () => {
    expect(
      validateSearchPageParams({
        q: 'moon',
        providerId: NASA_IVL_PROVIDER_ID,
        filters: { mediaType: 'image' },
      }),
    ).toEqual({
      q: 'moon',
      providerId: NASA_IVL_PROVIDER_ID,
      filters: { mediaType: 'image' },
    })
  })

  it('falls back to the query alone when no provider is selected', () => {
    expect(validateSearchPageParams({ q: 'moon' })).toEqual({ q: 'moon' })
  })

  it('falls back to the query alone for an unknown provider', () => {
    expect(
      validateSearchPageParams({ q: 'moon', providerId: 'bogus' }),
    ).toEqual({ q: 'moon' })
  })

  it('falls back to the query alone for provider-incompatible filters', () => {
    expect(
      validateSearchPageParams({
        q: 'moon',
        providerId: SI_OA_PROVIDER_ID,
        filters: { mediaType: 'image' },
      }),
    ).toEqual({ q: 'moon' })
  })

  it('defaults filters for a valid provider without explicit filters', () => {
    expect(
      validateSearchPageParams({ q: 'moon', providerId: NASA_IVL_PROVIDER_ID }),
    ).toEqual({
      q: 'moon',
      providerId: NASA_IVL_PROVIDER_ID,
      filters: {},
    })
  })

  it('defaults a missing query to an empty string', () => {
    expect(validateSearchPageParams({})).toEqual({ q: '' })
  })

  it('stringifies a numeric query', () => {
    expect(validateSearchPageParams({ q: 123 })).toEqual({ q: '123' })
  })
})

describe('search page route', () => {
  beforeEach(() => {
    mockPrefetchInfiniteSearch.mockReset()
    mockPrefetchInfiniteSearch.mockResolvedValue(undefined)
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

  it('skips prefetching when no provider is selected', async () => {
    await route.loader({
      context: {
        eyepieceClient: { request: vi.fn() },
        queryClient: { prefetchInfiniteQuery: vi.fn() },
      },
      deps: { q: 'moon' },
    })

    expect(mockPrefetchInfiniteSearch).not.toHaveBeenCalled()
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

  it('builds a generic title when there is no search query', () => {
    const head = route.head({
      match: { search: { q: '' } },
    })

    expect(head.meta).toEqual([{ title: 'Eyepiece | Search' }])
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
