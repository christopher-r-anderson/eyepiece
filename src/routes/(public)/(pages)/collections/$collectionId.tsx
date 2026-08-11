import { createFileRoute, notFound } from '@tanstack/react-router'
import { startTransition } from 'react'
import { css } from 'styled-system/css'
import { FavoriteButton } from '../-components/favorite-button'
import { useViewingAssetTileLinkProps } from '../-components/asset-viewing-overlay'
import type { AssetPreview } from '@/domain/asset/asset.schema'
import { AddToCollectionButton } from '@/app/add-to-collection-button'
import { JustifiedAssetGrid } from '@/features/assets/components/justified-asset-grid'
import {
  ensureAssetPreviewSnapshotsBatch,
  useAssetPreviewSnapshotsBatch,
} from '@/features/assets/asset-preview-snapshots.queries'
import {
  collectionItemPagesToAssetIds,
  ensureCollection,
  ensureInfiniteCollectionItemEdges,
  useSuspenseCollection,
  useSuspenseInfiniteCollectionItems,
} from '@/features/collections/collections.queries'
import { collectionIdSchema } from '@/features/collections/collections.schema'
import {
  ensureProfile,
  useSuspenseProfile,
} from '@/features/profiles/profiles.queries'
import { InfiniteLoader } from '@/components/infinite-loader/infinite-loader'
import { ManageCollectionLink } from '@/features/collections/components/manage-collection-link'
import { RouteError } from '@/app/layout/route-error'
import { NotFound } from '@/components/errors/not-found'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { AssetGridSkeleton } from '@/features/assets/components/asset-grid-skeleton'
import { getTitleText } from '@/lib/utils'
import { socialMeta } from '@/lib/social-meta'
import { toSocialImage } from '@/domain/asset/asset.utils'

// module-level so memoized grid rows see stable references
const renderTileActions = (item: AssetPreview) => (
  <>
    <FavoriteButton assetKey={item.key} />
    <AddToCollectionButton assetKey={item.key} variant="tile" />
  </>
)

export const Route = createFileRoute(
  '/(public)/(pages)/collections/$collectionId',
)({
  component: CollectionPage,
  beforeLoad: ({ params }) => {
    const collectionId = collectionIdSchema.safeParse(params.collectionId)
    if (!collectionId.success) {
      throw notFound()
    }
    return { collectionId: collectionId.data }
  },
  loader: async ({
    context: { queryClient, publicSupabaseClient, collectionId },
  }) => {
    // the anonymous read keeps this page viewer-independent: a private
    // collection is not-found for everyone, including its owner
    const collection = await ensureCollection({
      collectionId,
      queryClient,
      publicSupabaseClient,
    })
    if (!collection) {
      throw notFound()
    }
    const [edges] = await Promise.all([
      ensureInfiniteCollectionItemEdges({
        collectionId,
        queryClient,
        publicSupabaseClient,
      }),
      ensureProfile({
        id: collection.ownerId,
        queryClient,
        publicSupabaseClient,
      }),
    ])
    const snapshots = await ensureAssetPreviewSnapshotsBatch({
      assetPreviewSnapshotIds: collectionItemPagesToAssetIds(edges),
      queryClient,
      publicSupabaseClient,
    })
    const cover = snapshots[0]?.image
    return {
      title: collection.name,
      cover: cover && toSocialImage(cover),
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: getTitleText(loaderData?.title ?? 'Collection') },
      ...(loaderData
        ? socialMeta({ title: loaderData.title, image: loaderData.cover })
        : []),
    ],
  }),
  notFoundComponent: () => (
    <NotFound
      title="Collection not found"
      message="This collection doesn't exist, or it may be private."
    />
  ),
  errorComponent: ({ error }) => (
    <RouteError
      error={error}
      heading={<PageHeader title="Collection" />}
      message="Error loading collection."
      captureContext={{
        boundaryKind: 'route',
        feature: 'collections',
        operation: 'load_collection',
      }}
    />
  ),
  pendingComponent: () => (
    <>
      <PageHeader title="Collection" />
      <AssetGridSkeleton />
    </>
  ),
})

function CollectionPage() {
  const tileLinkProps = useViewingAssetTileLinkProps()
  const { collectionId } = Route.useRouteContext()
  const collection = useSuspenseCollection(collectionId)
  if (!collection) {
    throw notFound()
  }
  const owner = useSuspenseProfile(collection.ownerId)
  const itemsResult = useSuspenseInfiniteCollectionItems(collectionId)
  const snapshotsResult = useAssetPreviewSnapshotsBatch(
    itemsResult.data.assetPreviewSnapshotIds,
  )
  // failed page fetches would otherwise degrade silently: an edge-page
  // error only surfaces on the result once earlier pages exist, and an
  // errored snapshot batch holds no data for its new key so the fallback
  // below would render zero tiles. Both fail over to the route boundary,
  // matching how a first-page failure surfaces from the loader.
  if (itemsResult.isError) {
    throw itemsResult.error
  }
  if (snapshotsResult.isError) {
    throw snapshotsResult.error
  }
  const { total } = itemsResult.data

  return (
    <div className={css({ width: 'full' })}>
      <PageHeader
        title={collection.name}
        meta={
          <>
            {total} {total === 1 ? 'item' : 'items'}
            {owner ? ` · curated by ${owner.displayName}` : ''}{' '}
            <ManageCollectionLink collection={collection} />
          </>
        }
      />
      <div className={css({ marginTop: '5' })}>
        {total === 0 ? (
          <EmptyState>This collection is empty.</EmptyState>
        ) : (
          <InfiniteLoader
            // isFetching, not isLoading: after an edge page lands the batch
            // query switches keys and keepPreviousData reports isLoading
            // false while the new snapshots are still in flight
            isFetchingNextPage={
              itemsResult.isFetchingNextPage || snapshotsResult.isFetching
            }
            fetchNextPage={() => {
              startTransition(async () => {
                await itemsResult.fetchNextPage()
              })
            }}
            hasNextPage={itemsResult.hasNextPage}
            loadedCount={snapshotsResult.data?.length ?? 0}
            uiResetKey={collectionId}
          >
            <JustifiedAssetGrid
              startsInViewport
              tileLinkProps={tileLinkProps}
              items={snapshotsResult.data ?? []}
              tileActions={renderTileActions}
            />
          </InfiniteLoader>
        )}
      </div>
    </div>
  )
}
