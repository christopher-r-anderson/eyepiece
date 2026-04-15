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
import type { UserFavoritesRepo } from './favorites.repo'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { PaginatedCollection } from '@/domain/pagination/pagination.schema'
import type { FavoriteEdge } from './favorites.schema'
import { throwFromErrorResult, unwrapOrThrow } from '@/lib/result'
import { meKey } from '@/lib/query-keys'
import { DEFAULT_PAGE_SIZE } from '@/domain/pagination/pagination.schema'

const favoritesKeys = {
  all: [...meKey, 'favorites'] as const,
  index: () => [...favoritesKeys.all, 'index'] as const,
  edges: () => [...favoritesKeys.all, 'edges'] as const,
}

export function getUserFavoriteIndexOptions({
  repo,
}: {
  repo: Pick<UserFavoritesRepo, 'getUserFavoritesIndex'>
}) {
  return queryOptions({
    queryKey: favoritesKeys.index(),
    queryFn: async () => {
      const result = await repo.getUserFavoritesIndex()
      // keep an array instead of a set so structural sharing can preserve the reference
      return unwrapOrThrow(result)
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
      return queryClient.invalidateQueries({ queryKey: favoritesKeys.all })
    },
  })
}

type UserFavoritesEdgesPage = PaginatedCollection<FavoriteEdge>
type UserFavoritesEdgesInfinite = InfiniteData<
  Awaited<UserFavoritesEdgesPage>,
  number
>

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
    queryKey: favoritesKeys.edges(),
    queryFn: async ({ pageParam = 1 }) => {
      const result = await repo.getUserFavoritesEdges({
        page: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
      })
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

export function userFavoritesPagesToAssetIds({
  pages,
}: UserFavoritesEdgesInfinite) {
  return pages.flatMap((page) => page.items.map((edge) => edge.assetSummaryId))
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
