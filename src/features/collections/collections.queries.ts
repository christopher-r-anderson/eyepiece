import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'
import {
  makeCollectionsRepo,
  usePublicCollectionsRepo,
} from './collections.repo'
import type { CollectionsRepo } from './collections.repo'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { CollectionId, CollectionItemEdge } from './collections.schema'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { PaginatedCollection } from '@/domain/pagination/pagination.schema'
import { unwrapOrThrow } from '@/lib/result'
import { DEFAULT_PAGE_SIZE } from '@/domain/pagination/pagination.schema'

const collectionsKeys = {
  all: ['collections'] as const,
  detail: (collectionId: CollectionId) =>
    [...collectionsKeys.all, 'detail', collectionId] as const,
  itemEdges: (collectionId: CollectionId) =>
    [...collectionsKeys.detail(collectionId), 'itemEdges'] as const,
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
