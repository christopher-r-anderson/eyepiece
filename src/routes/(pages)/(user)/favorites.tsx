import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { StarIcon } from '@phosphor-icons/react/dist/ssr'
import { startTransition } from 'react'
import { AssetTile } from '@/features/assets/components/asset-tile'
import { HybridGrid } from '@/features/listing/item-grid/components/hybrid-grid'
import { HybridGridItem } from '@/features/listing/item-grid/components/hybrid-grid-item'
import {
  ensureInfiniteUserFavoritesEdges,
  useSuspenseInfiniteUserFavoriteAssetIds,
  userFavoritesPagesToAssetIds,
} from '@/features/favorites/favorites.queries'
import { InfiniteLoader } from '@/features/listing/infinite-loader/components/infinite-loader'
import {
  ensureAssetPreviewSnapshotsBatch,
  useAssetPreviewSnapshotsBatch,
} from '@/features/assets/asset-preview-snapshots.queries'
import { PrettyException } from '@/components/ui/error'
import { PageHeading } from '@/routes/-components/page-heading'
import { AssetGridSkeleton } from '@/routes/-components/asset-grid-skeleton'
import { toAssetKeyString } from '@/domain/asset/asset.utils'

const FavoritesHeading = () => <PageHeading>Favorites</PageHeading>

export const Route = createFileRoute('/(pages)/(user)/favorites')({
  component: FavoritesPage,
  loader: async ({
    context: { queryClient, publicSupabaseClient, userSupabaseClient },
  }) => {
    const edges = await ensureInfiniteUserFavoritesEdges({
      queryClient,
      userSupabaseClient,
    })
    const assetPreviewSnapshotIds = userFavoritesPagesToAssetIds(edges)
    await ensureAssetPreviewSnapshotsBatch({
      assetPreviewSnapshotIds,
      queryClient,
      publicSupabaseClient,
    })
  },
  errorComponent: ({ error }) => (
    <>
      <FavoritesHeading />
      <p>Error loading favorites.</p>
      <PrettyException error={error} headingLevel={1} />
    </>
  ),
  pendingComponent: () => (
    <>
      <FavoritesHeading />
      <AssetGridSkeleton />
    </>
  ),
})

function FavoritesPage() {
  const navigate = useNavigate()
  const favoritesResult = useSuspenseInfiniteUserFavoriteAssetIds()
  const assetSummariesResult = useAssetPreviewSnapshotsBatch(
    favoritesResult.data,
  )

  if (favoritesResult.data.length === 0) {
    return (
      <>
        <FavoritesHeading />
        <p>
          No favorites yet. <StarIcon aria-label="star" /> some pics!
        </p>
      </>
    )
  }
  return (
    <>
      <FavoritesHeading />
      <InfiniteLoader
        isFetchingNextPage={
          favoritesResult.isFetchingNextPage || assetSummariesResult.isLoading
        }
        fetchNextPage={() => {
          startTransition(async () => {
            await favoritesResult.fetchNextPage()
          })
        }}
        hasNextPage={favoritesResult.hasNextPage}
        loadedCount={assetSummariesResult.data?.length ?? 0}
        uiResetKey="favorites"
        css={{ width: '100%' }}
      >
        <HybridGrid
          css={{ width: '100%' }}
          items={assetSummariesResult.data ?? []}
          getItemKey={(item) => toAssetKeyString(item.key)}
          getItemTextValue={(item) => item.title}
        >
          {(item, itemProps) => (
            <HybridGridItem
              item={item}
              onRowAction={() => {
                navigate({
                  to: `/assets/$providerId/$assetId`,
                  params: {
                    providerId: item.key.providerId,
                    assetId: item.key.externalId,
                  },
                })
              }}
              {...itemProps}
            >
              <AssetTile assetPreview={item} />
            </HybridGridItem>
          )}
        </HybridGrid>
      </InfiniteLoader>
    </>
  )
}
