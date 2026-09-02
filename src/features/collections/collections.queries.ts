import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
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
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { CollectionsErrorCode } from './collections.const'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { PaginatedCollection } from '@/domain/pagination/pagination.schema'
import type { Result } from '@/lib/result'
import { useCurrentUserQuery } from '@/features/auth/auth.queries'
import { unwrapOrThrow } from '@/lib/result'
import { meKey } from '@/lib/query-keys'
import { mountOnlyListFreshness } from '@/lib/query-policies'
import { toAssetKeyString } from '@/domain/asset/asset.utils'
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
  list: (userId: string) =>
    [...userCollectionsKeys.all, 'list', userId] as const,
  membership: (userId: string, assetKey: AssetKey) =>
    [
      ...userCollectionsKeys.all,
      'membership',
      userId,
      toAssetKeyString(assetKey),
    ] as const,
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

function getCollectionOptions({
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
type CollectionItemEdgesInfinite = InfiniteData<
  CollectionItemEdgesPage,
  string | null
>

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
    queryFn: async ({ pageParam = null }) => {
      const result = await repo.getCollectionItemEdges(collectionId, {
        cursor: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
      })
      return unwrapOrThrow(result)
    },
    placeholderData: keepPreviousData,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    staleTime: 5 * 60 * 1000,
    ...mountOnlyListFreshness,
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

function getUserCollectionOptions({
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
    queryFn: async ({ pageParam = null }) => {
      const result = await repo.getCollectionItemEdges(collectionId, {
        cursor: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
      })
      return unwrapOrThrow(result)
    },
    placeholderData: keepPreviousData,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    staleTime: 5 * 60 * 1000,
    // mount-only freshness: any mid-visit background refetch (focus,
    // reconnect) could yank rows out from under removal ghosts
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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

function collectionItemPagesToEdgesView(data: CollectionItemEdgesInfinite) {
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

export function getUserCollectionsListOptions({
  userId,
  repo,
}: {
  userId: string
  repo: Pick<CollectionsRepo, 'getUserCollections'>
}) {
  return queryOptions({
    queryKey: userCollectionsKeys.list(userId),
    queryFn: async () => {
      const result = await repo.getUserCollections(userId)
      return unwrapOrThrow(result)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUserCollectionsList(userId: string) {
  const repo = useUserCollectionsRepo()
  return useQuery(getUserCollectionsListOptions({ userId, repo }))
}

export function getAssetCollectionMembershipOptions({
  userId,
  assetKey,
  repo,
}: {
  userId: string
  assetKey: AssetKey
  repo: Pick<CollectionsRepo, 'getCollectionIdsForAsset'>
}) {
  return queryOptions({
    queryKey: userCollectionsKeys.membership(userId, assetKey),
    queryFn: async () => {
      const result = await repo.getCollectionIdsForAsset(userId, assetKey)
      return unwrapOrThrow(result)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useAssetCollectionMembership({
  userId,
  assetKey,
}: {
  userId: string
  assetKey: AssetKey
}) {
  const repo = useUserCollectionsRepo()
  return useQuery(
    getAssetCollectionMembershipOptions({ userId, assetKey, repo }),
  )
}

const isItemEdges = ({ queryKey }: { queryKey: ReadonlyArray<unknown> }) =>
  queryKey.includes('itemEdges')

// item-edge lists are marked stale but never actively refetched by ANY
// mutation: a mounted grid may hold removal ghosts (manage), or anchor the
// open picker itself (a public page's tile vanishing mid-refetch unmounts
// the popover the user is still toggling). Grid lists refresh on mount
// only - their options also disable focus/reconnect refetches.
const BOTH_FAMILIES = [userCollectionsKeys.all, collectionsKeys.all] as const

// name/visibility/deletion mutations can change every card, list row, and
// collection detail across both families
function invalidateCollectionsQueries(
  queryClient: QueryClient,
  refetchType: 'active' | 'none',
) {
  return Promise.all(
    BOTH_FAMILIES.flatMap((queryKey) => [
      queryClient.invalidateQueries({
        queryKey,
        refetchType: 'none',
        predicate: isItemEdges,
      }),
      queryClient.invalidateQueries({
        queryKey,
        refetchType,
        predicate: (query) => !isItemEdges(query),
      }),
    ]),
  )
}

// an item add/remove only moves this asset's membership and the acting
// owner's card counts/covers: the viewer-scoped `cards` (one per viewer)
// plus their own `publicCards`. Another owner's public cards (the homepage
// showcase, a visited profile) cannot change, nor can the plain list, a
// detail row, or another asset's membership.
function invalidateItemMembershipQueries(
  queryClient: QueryClient,
  assetKey: AssetKey,
  ownerId: string | undefined,
) {
  const assetKeyString = toAssetKeyString(assetKey)
  const isAffected = ({ queryKey }: { queryKey: ReadonlyArray<unknown> }) =>
    queryKey.includes('cards') ||
    (queryKey.includes('publicCards') && queryKey.includes(ownerId)) ||
    (queryKey.includes('membership') && queryKey.includes(assetKeyString))
  return Promise.all(
    BOTH_FAMILIES.flatMap((queryKey) => [
      queryClient.invalidateQueries({
        queryKey,
        refetchType: 'none',
        predicate: isItemEdges,
      }),
      queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
        predicate: isAffected,
      }),
    ]),
  )
}

// a new collection is empty, so it only adds a row to the owner's list and
// cards, plus their own public cards when it is public. It touches no
// membership, no existing detail or item-edge list, and no other owner's
// public cards; create-and-add relies on the add to refresh counts.
function invalidateNewCollectionQueries(
  queryClient: QueryClient,
  ownerId: string | undefined,
  isPublic: boolean,
) {
  const isAffected = ({ queryKey }: { queryKey: ReadonlyArray<unknown> }) =>
    queryKey.includes('list') ||
    queryKey.includes('cards') ||
    (isPublic && queryKey.includes('publicCards') && queryKey.includes(ownerId))
  return Promise.all(
    BOTH_FAMILIES.map((queryKey) =>
      queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
        predicate: isAffected,
      }),
    ),
  )
}

function useCollectionsMutation<TInput, TData>(
  command: (
    input: TInput,
  ) => Promise<Result<TData, CollectionsErrorCode | undefined>>,
  invalidate: (queryClient: QueryClient, variables: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: TInput) => unwrapOrThrow(await command(input)),
    onSettled: (_data, _error, variables) => invalidate(queryClient, variables),
  })
}

const invalidateSettingsMutation = (queryClient: QueryClient) =>
  invalidateCollectionsQueries(queryClient, 'active')

export function useCreateCollection() {
  const commands = useCollectionsCommands()
  const { data: user } = useCurrentUserQuery()
  return useCollectionsMutation(
    commands.createCollection,
    (queryClient, { visibility }) =>
      invalidateNewCollectionQueries(
        queryClient,
        user?.id,
        visibility === 'public',
      ),
  )
}

export function useRenameCollection() {
  const commands = useCollectionsCommands()
  return useCollectionsMutation(
    commands.renameCollection,
    invalidateSettingsMutation,
  )
}

export function useSetCollectionVisibility() {
  const commands = useCollectionsCommands()
  return useCollectionsMutation(
    commands.setCollectionVisibility,
    invalidateSettingsMutation,
  )
}

// refetchType 'none': an active refetch races the post-delete navigation
// and yanks the deleted collection out from under the still-mounted manage
// page; every reader refetches its now-stale data on next mount
export function useDeleteCollection() {
  const commands = useCollectionsCommands()
  return useCollectionsMutation(commands.deleteCollection, (queryClient) =>
    invalidateCollectionsQueries(queryClient, 'none'),
  )
}

export function useAddCollectionItem() {
  const commands = useCollectionsCommands()
  const { data: user } = useCurrentUserQuery()
  return useCollectionsMutation(
    commands.addCollectionItem,
    (queryClient, { assetKey }) =>
      invalidateItemMembershipQueries(queryClient, assetKey, user?.id),
  )
}

// ghost safety lives in the invalidation helper (user-family item edges
// are never actively refetched); everything else refreshes actively so an
// open picker's membership checkboxes reflect the removal immediately
export function useRemoveCollectionItem() {
  const commands = useCollectionsCommands()
  const { data: user } = useCurrentUserQuery()
  return useCollectionsMutation(
    commands.removeCollectionItem,
    (queryClient, { assetKey }) =>
      invalidateItemMembershipQueries(queryClient, assetKey, user?.id),
  )
}

export function useAddCollectionItemAtPosition() {
  const commands = useCollectionsCommands()
  const { data: user } = useCurrentUserQuery()
  return useCollectionsMutation(
    commands.addCollectionItemAtPosition,
    (queryClient, { assetKey }) =>
      invalidateItemMembershipQueries(queryClient, assetKey, user?.id),
  )
}
