import { createElement } from 'react'
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getInfiniteUserFavoritesEdgesOptions,
  getUserFavoriteIndexOptions,
  useUnfavorite,
} from './favorites.queries'
import { unfavorite } from './favorites.functions'
import type { ReactNode } from 'react'
import { Ok } from '@/lib/result'

// ---------------------------------------------------------------------------
// favorites.functions is mocked at the top level so that importing the query
// hooks never triggers favorites.functions' module-scope createServerFn()
// calls.
// ---------------------------------------------------------------------------

vi.mock('./favorites.functions', () => ({
  toggleFavorite: vi.fn(),
  refavoriteAt: vi.fn(),
  unfavorite: vi.fn(),
}))

const ASSET_KEY = {
  providerId: 'nasa_ivl',
  externalId: 'ARC-1998-AC98-0418-6',
} as const

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe('favorites mutation invalidation', () => {
  it('unfavorite never refetches the active edges list but refreshes the index', async () => {
    const queryClient = new QueryClient()
    const getUserFavoritesEdges = vi
      .fn()
      .mockResolvedValue(
        Ok({ items: [], pagination: { next: null, total: 0 } }),
      )
    const getUserFavoritesIndex = vi.fn().mockResolvedValue(Ok([]))
    renderHook(
      () =>
        useInfiniteQuery(
          getInfiniteUserFavoritesEdgesOptions({
            repo: { getUserFavoritesEdges },
          }),
        ),
      { wrapper: makeWrapper(queryClient) },
    )
    renderHook(
      () =>
        useQuery(
          getUserFavoriteIndexOptions({ repo: { getUserFavoritesIndex } }),
        ),
      { wrapper: makeWrapper(queryClient) },
    )
    await waitFor(() => {
      expect(getUserFavoritesEdges).toHaveBeenCalledOnce()
      expect(getUserFavoritesIndex).toHaveBeenCalledOnce()
    })

    vi.mocked(unfavorite).mockResolvedValue({ removed: true })
    const { result } = renderHook(() => useUnfavorite(), {
      wrapper: makeWrapper(queryClient),
    })
    await result.current.mutateAsync(ASSET_KEY)

    // the star index refreshes so other surfaces reflect the unstar...
    await waitFor(() => expect(getUserFavoritesIndex).toHaveBeenCalledTimes(2))
    // ...while the ghost-bearing edges list is only marked stale
    expect(
      queryClient.getQueryState(['me', 'favorites', 'edges'])?.isInvalidated,
    ).toBe(true)
    expect(getUserFavoritesEdges).toHaveBeenCalledOnce()
  })
})
