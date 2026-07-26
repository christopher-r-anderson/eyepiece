import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'
import {
  makeCollectionsRepo,
  usePublicCollectionsRepo,
  useUserCollectionsRepo,
} from './collections.repo'
import { useCollectionsCommands } from './collections.commands'
import type { CollectionsRepo } from './collections.repo'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { CollectionId, CollectionItemEdge } from './collections.schema'
import type { CollectionsErrorCode } from './collections.const'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { PaginatedCollection } from '@/domain/pagination/pagination.schema'
import type { Result } from '@/lib/result'
import { unwrapOrThrow } from '@/lib/result'
import { meKey } from '@/lib/query-keys'
import { DEFAULT_PAGE_SIZE } from '@/domain/pagination/pagination.schema'

const collectionsKeys = {
  all: ['collections'] as const,
  detail: (collectionId: CollectionId) =>
    [...collectionsKeys.all, 'detail', collectionId] as const,
  itemEdges: (collectionId: CollectionId) =>
    [...collectionsKeys.detail(collectionId), 'itemEdges'] as const,
  publicCards: (ownerId: string) =>
    [...collectionsKeys.all, 'publicCards', ownerId] as const,
}

// viewer-scoped reads live under meKey so auth changes invalidate them.
// They never share keys with the public family: a private collection cached
// under the public keys would leak into the viewer-independent public route.
const userCollectionsKeys = {
  all: [...meKey, 'collections'] as const,
  cards: (userId: string) =>
    [...userCollectionsKeys.all, 'cards', userId] as const,
  detail: (collectionId: CollectionId) =>
    [...userCollectionsKeys.all, 'detail', collectionId] as const,
  itemEdges: (collectionId: CollectionId) =>
    [...userCollectionsKeys.detail(collectionId), 'itemEdges'] as const,
}

export function getPublicCollectionCardsOptions({
  ownerId,
  repo,
}: {
  ownerId: string
  repo: Pick<CollectionsRepo, 'getPublicCollectionCardsForOwner'>
}) {
  return queryOptions({
    queryKey: collectionsKeys.publicCards(ownerId),
    queryFn: async () => {
      const result = await repo.getPublicCollectionCardsForOwner(ownerId)
      return unwrapOrThrow(result)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function prefetchPublicCollectionCards({
  ownerId,
  queryClient,
  publicSupabaseClient,
}: {
  ownerId: string
  queryClient: QueryClient
  publicSupabaseClient: SupabaseClient
}) {
  const repo = makeCollectionsRepo(publicSupabaseClient)
  return queryClient.prefetchQuery(
    getPublicCollectionCardsOptions({ ownerId, repo }),
  )
}

export function useSuspensePublicCollectionCards(ownerId: string) {
  const repo = usePublicCollectionsRepo()
  const { data } = useSuspenseQuery(
    getPublicCollectionCardsOptions({ ownerId, repo }),
  )
  return data
}

export function getCollectionOptions({
  collectionId,
  repo,
}: {
  collectionId: CollectionId
  repo: Pick<CollectionsRepo, 'getCollection'>
}) {
  return queryOptions({
    queryKey: collectionsKeys.detail(collectionId),
    queryFn: async () => {
      const result = await repo.getCollection(collectionId)
      return unwrapOrThrow(result)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export async function ensureCollection({
  collectionId,
  queryClient,
  publicSupabaseClient,
}: {
  collectionId: CollectionId
  queryClient: QueryClient
  publicSupabaseClient: SupabaseClient
}) {
  const repo = makeCollectionsRepo(publicSupabaseClient)
  return queryClient.ensureQueryData(
    getCollectionOptions({ collectionId, repo }),
  )
}

export function useSuspenseCollection(collectionId: CollectionId) {
  const repo = usePublicCollectionsRepo()
  const { data: collection } = useSuspenseQuery(
    getCollectionOptions({ collectionId, repo }),
  )
  return collection
}

type CollectionItemEdgesPage = PaginatedCollection<CollectionItemEdge>
type CollectionItemEdgesInfinite = InfiniteData<CollectionItemEdgesPage, number>

export function getInfiniteCollectionItemEdgesOptions<
  TSelectData = CollectionItemEdgesInfinite,
>({
  collectionId,
  select,
  repo,
}: {
  collectionId: CollectionId
  select?: (data: CollectionItemEdgesInfinite) => TSelectData
  repo: Pick<CollectionsRepo, 'getCollectionItemEdges'>
}) {
  return infiniteQueryOptions({
    queryKey: collectionsKeys.itemEdges(collectionId),
    queryFn: async ({ pageParam = 1 }) => {
      const result = await repo.getCollectionItemEdges(collectionId, {
        page: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
      })
      return unwrapOrThrow(result)
    },
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    staleTime: 5 * 60 * 1000,
    // a focus refetch could yank rows out from under removal ghosts
    refetchOnWindowFocus: false,
    select,
  })
}

export async function ensureInfiniteCollectionItemEdges({
  collectionId,
  queryClient,
  publicSupabaseClient,
}: {
  collectionId: CollectionId
  queryClient: QueryClient
  publicSupabaseClient: SupabaseClient
}) {
  const repo = makeCollectionsRepo(publicSupabaseClient)
  return queryClient.ensureInfiniteQueryData(
    getInfiniteCollectionItemEdgesOptions({ collectionId, repo }),
  )
}

export function collectionItemPagesToAssetIds({
  pages,
}: CollectionItemEdgesInfinite) {
  return pages.flatMap((page) =>
    page.items.map((edge) => edge.assetPreviewSnapshotId),
  )
}

export function collectionItemPagesToItemsView(
  data: CollectionItemEdgesInfinite,
) {
  return {
    assetPreviewSnapshotIds: collectionItemPagesToAssetIds(data),
    total: data.pages[0]?.pagination.total ?? 0,
  }
}

export function useSuspenseInfiniteCollectionItems(collectionId: CollectionId) {
  const repo = usePublicCollectionsRepo()
  return useSuspenseInfiniteQuery(
    getInfiniteCollectionItemEdgesOptions({
      collectionId,
      select: collectionItemPagesToItemsView,
      repo,
    }),
  )
}

export function getUserCollectionCardsOptions({
  userId,
  repo,
}: {
  userId: string
  repo: Pick<CollectionsRepo, 'getCollectionCardsForOwner'>
}) {
  return queryOptions({
    queryKey: userCollectionsKeys.cards(userId),
    queryFn: async () => {
      const result = await repo.getCollectionCardsForOwner(userId)
      return unwrapOrThrow(result)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function ensureUserCollectionCards({
  userId,
  queryClient,
  userSupabaseClient,
}: {
  userId: string
  queryClient: QueryClient
  userSupabaseClient: SupabaseClient
}) {
  const repo = makeCollectionsRepo(userSupabaseClient)
  return queryClient.ensureQueryData(
    getUserCollectionCardsOptions({ userId, repo }),
  )
}

export function useSuspenseUserCollectionCards(userId: string) {
  const repo = useUserCollectionsRepo()
  const { data } = useSuspenseQuery(
    getUserCollectionCardsOptions({ userId, repo }),
  )
  return data
}

export function getUserCollectionOptions({
  collectionId,
  repo,
}: {
  collectionId: CollectionId
  repo: Pick<CollectionsRepo, 'getCollection'>
}) {
  return queryOptions({
    queryKey: userCollectionsKeys.detail(collectionId),
    queryFn: async () => {
      const result = await repo.getCollection(collectionId)
      return unwrapOrThrow(result)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function ensureUserCollection({
  collectionId,
  queryClient,
  userSupabaseClient,
}: {
  collectionId: CollectionId
  queryClient: QueryClient
  userSupabaseClient: SupabaseClient
}) {
  const repo = makeCollectionsRepo(userSupabaseClient)
  return queryClient.ensureQueryData(
    getUserCollectionOptions({ collectionId, repo }),
  )
}

export function useSuspenseUserCollection(collectionId: CollectionId) {
  const repo = useUserCollectionsRepo()
  const { data } = useSuspenseQuery(
    getUserCollectionOptions({ collectionId, repo }),
  )
  return data
}

export function getInfiniteUserCollectionItemEdgesOptions<
  TSelectData = CollectionItemEdgesInfinite,
>({
  collectionId,
  select,
  repo,
}: {
  collectionId: CollectionId
  select?: (data: CollectionItemEdgesInfinite) => TSelectData
  repo: Pick<CollectionsRepo, 'getCollectionItemEdges'>
}) {
  return infiniteQueryOptions({
    queryKey: userCollectionsKeys.itemEdges(collectionId),
    queryFn: async ({ pageParam = 1 }) => {
      const result = await repo.getCollectionItemEdges(collectionId, {
        page: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
      })
      return unwrapOrThrow(result)
    },
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    staleTime: 5 * 60 * 1000,
    // a focus refetch could yank rows out from under removal ghosts
    refetchOnWindowFocus: false,
    select,
  })
}

export async function ensureInfiniteUserCollectionItemEdges({
  collectionId,
  queryClient,
  userSupabaseClient,
}: {
  collectionId: CollectionId
  queryClient: QueryClient
  userSupabaseClient: SupabaseClient
}) {
  const repo = makeCollectionsRepo(userSupabaseClient)
  return queryClient.ensureInfiniteQueryData(
    getInfiniteUserCollectionItemEdgesOptions({ collectionId, repo }),
  )
}

export function collectionItemPagesToEdgesView(
  data: CollectionItemEdgesInfinite,
) {
  return {
    edges: data.pages.flatMap((page) => page.items),
    total: data.pages[0]?.pagination.total ?? 0,
  }
}

export function useSuspenseInfiniteUserCollectionItemEdges(
  collectionId: CollectionId,
) {
  const repo = useUserCollectionsRepo()
  return useSuspenseInfiniteQuery(
    getInfiniteUserCollectionItemEdgesOptions({
      collectionId,
      select: collectionItemPagesToEdgesView,
      repo,
    }),
  )
}

// every mutation can change names, counts, covers, membership, or
// visibility, so both the viewer-scoped and public families go stale
function invalidateCollectionsQueries(
  queryClient: QueryClient,
  refetchType: 'active' | 'none',
) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: userCollectionsKeys.all,
      refetchType,
    }),
    queryClient.invalidateQueries({
      queryKey: collectionsKeys.all,
      refetchType,
    }),
  ])
}

function useCollectionsMutation<TInput, TData>(
  command: (
    input: TInput,
  ) => Promise<Result<TData, CollectionsErrorCode | undefined>>,
  { refetchType = 'active' }: { refetchType?: 'active' | 'none' } = {},
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: TInput) => unwrapOrThrow(await command(input)),
    onSettled: () => invalidateCollectionsQueries(queryClient, refetchType),
  })
}

export function useCreateCollection() {
  const commands = useCollectionsCommands()
  return useCollectionsMutation(commands.createCollection)
}

export function useRenameCollection() {
  const commands = useCollectionsCommands()
  return useCollectionsMutation(commands.renameCollection)
}

export function useSetCollectionVisibility() {
  const commands = useCollectionsCommands()
  return useCollectionsMutation(commands.setCollectionVisibility)
}

// refetchType 'none': an active refetch races the post-delete navigation
// and yanks the deleted collection out from under the still-mounted manage
// page; every reader refetches its now-stale data on next mount
export function useDeleteCollection() {
  const commands = useCollectionsCommands()
  return useCollectionsMutation(commands.deleteCollection, {
    refetchType: 'none',
  })
}

export function useAddCollectionItem() {
  const commands = useCollectionsCommands()
  return useCollectionsMutation(commands.addCollectionItem)
}

// refetchType 'none': a removal must never refetch a mounted grid out from
// under its dimmed undo ghost; unmounted queries are marked stale either
// way, so everything refreshes on the next visit
export function useRemoveCollectionItem() {
  const commands = useCollectionsCommands()
  return useCollectionsMutation(commands.removeCollectionItem, {
    refetchType: 'none',
  })
}

// undo's re-add shares removal's contract: the restored tile is already
// in place as the un-dimmed ghost
export function useAddCollectionItemAtPosition() {
  const commands = useCollectionsCommands()
  return useCollectionsMutation(commands.addCollectionItemAtPosition, {
    refetchType: 'none',
  })
}
