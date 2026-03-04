import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  UserFavoritesEdgesPage,
  UserFavoritesRepo,
} from './favorites.repo'
import type { InfiniteData } from '@tanstack/react-query'
import type { UserFavoritesCommands } from './favorites.commands'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { throwFromErrorResult, unwrapOrThrow } from '@/lib/result'
import { meKey } from '@/lib/query-keys'

export const userFavoritesKey = [...meKey, 'favorites'] as const
export const userFavoritesIndexKey = [...userFavoritesKey, 'index'] as const
export const userFavoriteEdgesKey = [...userFavoritesKey, 'edges'] as const

export function getUserFavoriteIndexOptions({
  enabled = true,
  repo,
}: {
  enabled?: boolean
  repo: Pick<UserFavoritesRepo, 'getUserFavoritesIndex'>
}) {
  return queryOptions({
    queryKey: userFavoritesIndexKey,
    queryFn: async () => {
      const result = await repo.getUserFavoritesIndex()
      return unwrapOrThrow(result)
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  })
}

export function useUserFavoritesIndex({
  enabled = true,
  repo,
}: {
  enabled?: boolean
  repo: Pick<UserFavoritesRepo, 'getUserFavoritesIndex'>
}) {
  return useQuery(getUserFavoriteIndexOptions({ enabled, repo }))
}

export function useToggleUserFavorite(
  commands: Pick<UserFavoritesCommands, 'toggleFavorite'>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AssetKey) => {
      const { error } = await commands.toggleFavorite(input)
      if (error) {
        throwFromErrorResult(error)
      }
    },
    onSettled: () => {
      return queryClient.invalidateQueries({ queryKey: userFavoritesKey })
    },
  })
}

type UserFavoritesEdgesInfinite = InfiniteData<UserFavoritesEdgesPage, number>

export function getUserFavoritesEdgesOptions<
  TSelectData = UserFavoritesEdgesInfinite,
>({
  select,
  repo,
}: {
  select?: (data: UserFavoritesEdgesInfinite) => TSelectData
  repo: Pick<UserFavoritesRepo, 'getUserFavoritesEdges'>
}) {
  return infiniteQueryOptions({
    queryKey: userFavoriteEdgesKey,
    queryFn: async ({ pageParam = 1 }) => {
      const result = await repo.getUserFavoritesEdges({ page: pageParam })
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

export function useUserFavoriteAssetIds({
  repo,
}: {
  repo: Pick<UserFavoritesRepo, 'getUserFavoritesEdges'>
}) {
  return useInfiniteQuery(
    getUserFavoritesEdgesOptions({
      select: userFavoritesPagesToAssetIds,
      repo,
    }),
  )
}
