import { createFileRoute, notFound } from '@tanstack/react-router'
import { startTransition } from 'react'
import { css } from 'styled-system/css'
import { FavoriteButton } from '../-components/favorite-button'
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
import { InfiniteLoader } from '@/features/listing/infinite-loader/components/infinite-loader'
import { RouteError } from '@/app/layout/route-error'
import { PageHeading } from '@/routes/-components/page-heading'
import { AssetGridSkeleton } from '@/routes/-components/asset-grid-skeleton'
import { getTitleText } from '@/lib/utils'

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
    await ensureAssetPreviewSnapshotsBatch({
      assetPreviewSnapshotIds: collectionItemPagesToAssetIds(edges),
      queryClient,
      publicSupabaseClient,
    })
    return { title: collection.name }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: getTitleText(loaderData?.title ?? 'Collection') }],
  }),
  notFoundComponent: () => (
    <>
      <PageHeading>Collection Not Found</PageHeading>
      <p>This collection doesn't exist, or it may be private.</p>
    </>
  ),
  errorComponent: ({ error }) => (
    <RouteError
      error={error}
      heading={<PageHeading>Collection</PageHeading>}
      message="Error loading collection."
    />
  ),
  pendingComponent: () => (
    <>
      <PageHeading>Collection</PageHeading>
      <AssetGridSkeleton />
    </>
  ),
})

function CollectionPage() {
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
  // a failed snapshot page would otherwise blank the grid silently: on
  // error the batch query holds no data for its new key, so the fallback
  // below would render zero tiles. Failing over to the route boundary
  // matches how a first-page failure surfaces from the loader.
  if (snapshotsResult.isError) {
    throw snapshotsResult.error
  }
  const { total } = itemsResult.data

  return (
    <div className={css({ width: '100%' })}>
      <h1
        className={css({
          textStyle: 'display.md',
          overflowWrap: 'anywhere',
        })}
      >
        {collection.name}
      </h1>
      <p
        className={css({
          marginTop: '2',
          fontFamily: 'mono',
          fontSize: 'mono',
          textTransform: 'lowercase',
          color: 'text.muted',
        })}
      >
        {total} {total === 1 ? 'item' : 'items'}
        {owner ? ` · curated by ${owner.displayName}` : ''}
      </p>
      <div className={css({ marginTop: '5' })}>
        {total === 0 ? (
          <p>This collection is empty.</p>
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
              items={snapshotsResult.data ?? []}
              tileActions={(item) => <FavoriteButton assetKey={item.key} />}
            />
          </InfiniteLoader>
        )}
      </div>
    </div>
  )
}
