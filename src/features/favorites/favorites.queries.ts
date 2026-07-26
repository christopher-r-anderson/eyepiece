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
import type { FavoriteEdge, RefavoriteAtInput } from './favorites.schema'
import { throwFromErrorResult, unwrapOrThrow } from '@/lib/result'
import { meKey } from '@/lib/query-keys'
import { mountOnlyListFreshness } from '@/lib/query-policies'
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

// the edges list is marked stale but never actively refetched: the mounted
// favorites grid may be holding removal ghosts. Everything else (the star
// index) refreshes actively.
function invalidateFavoritesQueries(queryClient: QueryClient) {
  const isEdges = ({ queryKey }: { queryKey: ReadonlyArray<unknown> }) =>
    queryKey.includes('edges')
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: favoritesKeys.all,
      refetchType: 'none',
      predicate: isEdges,
    }),
    queryClient.invalidateQueries({
      queryKey: favoritesKeys.all,
      predicate: (query) => !isEdges(query),
    }),
  ])
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
    onSettled: () => invalidateFavoritesQueries(queryClient),
  })
}

export function useUnfavorite() {
  const queryClient = useQueryClient()
  const commands = useUserFavoritesCommands()

  return useMutation({
    mutationFn: async (assetKey: AssetKey) => {
      const { error } = await commands.unfavorite(assetKey)
      if (error) {
        throwFromErrorResult(error)
      }
    },
    onSettled: () => invalidateFavoritesQueries(queryClient),
  })
}

export function useRefavoriteAt() {
  const queryClient = useQueryClient()
  const commands = useUserFavoritesCommands()

  return useMutation({
    mutationFn: async (input: RefavoriteAtInput) => {
      const { error } = await commands.refavoriteAt(input)
      if (error) {
        throwFromErrorResult(error)
      }
    },
    onSettled: () => invalidateFavoritesQueries(queryClient),
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
    ...mountOnlyListFreshness,
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
  return pages.flatMap((page) =>
    page.items.map((edge) => edge.assetPreviewSnapshotId),
  )
}

export function userFavoritesPagesToEdgesView(
  data: UserFavoritesEdgesInfinite,
) {
  return {
    edges: data.pages.flatMap((page) => page.items),
    total: data.pages[0]?.pagination.total ?? 0,
  }
}

export function useSuspenseInfiniteUserFavoriteEdges() {
  const repo = useUserFavoritesRepo()
  return useSuspenseInfiniteQuery(
    getInfiniteUserFavoritesEdgesOptions({
      select: userFavoritesPagesToEdgesView,
      repo,
    }),
  )
}
