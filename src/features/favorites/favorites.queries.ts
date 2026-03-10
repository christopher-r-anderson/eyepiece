import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query'
import { makeUserFavoritesRepo, useUserFavoritesRepo } from './favorites.repo'
import { useUserFavoritesCommands } from './favorites.commands'
import type {
  UserFavoritesEdgesPage,
  UserFavoritesRepo,
} from './favorites.repo'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { SupabaseClient } from '@/integrations/supabase/types'
import { throwFromErrorResult, unwrapOrThrow } from '@/lib/result'
import { meKey } from '@/lib/query-keys'
import { toAssetKeyString } from '@/domain/asset/asset.utils'

export const userFavoritesKey = [...meKey, 'favorites'] as const
export const userFavoritesIndexKey = [...userFavoritesKey, 'index'] as const
export const userFavoriteEdgesKey = [...userFavoritesKey, 'edges'] as const

export function getUserFavoriteIndexOptions({
  repo,
}: {
  repo: Pick<UserFavoritesRepo, 'getUserFavoritesIndex'>
}) {
  return queryOptions({
    queryKey: userFavoritesIndexKey,
    queryFn: async () => {
      const result = await repo.getUserFavoritesIndex()
      const keys = unwrapOrThrow(result)
      // use an array instead of a set so structural sharing can preserve the reference
      return keys.map(({ provider, externalId }) =>
        toAssetKeyString({ provider, externalId }),
      )
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUserFavoritesIndex({ enabled }: { enabled?: boolean }) {
  const repo = useUserFavoritesRepo()
  return useQuery({
    ...getUserFavoriteIndexOptions({ repo }),
    enabled,
  })
}

export function useToggleUserFavorite() {
  const queryClient = useQueryClient()
  const commands = useUserFavoritesCommands()

  return useMutation({
    mutationFn: async (assetKey: AssetKey) => {
      const { error } = await commands.toggleFavorite(assetKey)
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

export function getInfiniteUserFavoritesEdgesOptions<
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
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    staleTime: 5 * 60 * 1000,
    select,
  })
}

export async function ensureInfiniteUserFavoritesEdges({
  queryClient,
  userSupabaseClient,
}: {
  queryClient: QueryClient
  userSupabaseClient: SupabaseClient
}) {
  const userFavoritesRepo = makeUserFavoritesRepo(userSupabaseClient)
  return await queryClient.ensureInfiniteQueryData(
    getInfiniteUserFavoritesEdgesOptions({ repo: userFavoritesRepo }),
  )
}

export function userFavoritesPagesToAssetIds<
  TData extends UserFavoritesEdgesPage,
>({ pages }: InfiniteData<TData, number>) {
  return pages.flatMap((page) => page.edges.map((edge) => edge.assetSummaryId))
}

export function useSuspenseInfiniteUserFavoriteAssetIds() {
  const repo = useUserFavoritesRepo()
  return useSuspenseInfiniteQuery(
    getInfiniteUserFavoritesEdgesOptions({
      select: userFavoritesPagesToAssetIds,
      repo,
    }),
  )
}
