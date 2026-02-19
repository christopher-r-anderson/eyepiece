import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  getUserFavoritesEdges,
  getUserFavoritesIndex,
} from './favorites-service'
import { toggleFavorite } from './favorites.server'
import type { UserFavoritesEdgesPage } from './favorites-service'
import type { InfiniteData } from '@tanstack/react-query'
import type { ToggleFavoriteInput } from './favorites.schemas'
import { unwrapOrThrow } from '@/lib/result'

export const userFavoritesIndexKey = ['me', 'favorites', 'index'] as const
export const userFavoriteEdgesKey = ['me', 'favorites', 'edges'] as const

export function getUserFavoriteIndexOptions({
  enabled = true,
}: {
  enabled?: boolean
} = {}) {
  return queryOptions({
    queryKey: userFavoritesIndexKey,
    queryFn: async () => {
      const result = await getUserFavoritesIndex()
      return unwrapOrThrow(result)
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  })
}

export function useUserFavoritesIndex({
  enabled = true,
}: {
  enabled?: boolean
} = {}) {
  return useQuery(getUserFavoriteIndexOptions({ enabled }))
}

export function useToggleUserFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ToggleFavoriteInput) => toggleFavorite({ data: input }),
    onSettled: () => {
      return queryClient.invalidateQueries({ queryKey: ['me', 'favorites'] })
    },
  })
}

type UserFavoritesEdgesInfinite = InfiniteData<UserFavoritesEdgesPage, number>

export function getUserFavoritesEdgesOptions<
  TSelectData = UserFavoritesEdgesInfinite,
>({
  select,
}: {
  select?: (data: UserFavoritesEdgesInfinite) => TSelectData
} = {}) {
  return infiniteQueryOptions({
    queryKey: userFavoriteEdgesKey,
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getUserFavoritesEdges({ page: pageParam })
      return unwrapOrThrow(result)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    staleTime: 5 * 60 * 1000,
    select,
  })
}

export function userFavoritesPagesToAssetIds<
  TData extends UserFavoritesEdgesPage,
>({ pages }: InfiniteData<TData, number>) {
  return pages.flatMap((page) => page.edges.map((edge) => edge.assetSummaryId))
}

export function useUserFavoriteAssetIds() {
  return useInfiniteQuery(
    getUserFavoritesEdgesOptions({ select: userFavoritesPagesToAssetIds }),
  )
}
