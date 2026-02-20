import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { StarIcon } from '@phosphor-icons/react/dist/ssr'
import { AssetTile } from '@/features/assets/components/asset-tile'
import { HybridGrid } from '@/features/listing/item-grid/hybrid-grid'
import { HybridGridItem } from '@/features/listing/item-grid/hybrid-grid-item'
import {
  getUserFavoritesEdgesOptions,
  useUserFavoriteAssetIds,
  userFavoritesPagesToAssetIds,
} from '@/features/favorites/favorites.queries'
import { InfiniteLoader } from '@/features/listing/infinite-loader/infinite-loader'
import {
  getAssetSummariesBatchOptions,
  useAssetSummariesBatch,
} from '@/features/assets/api/asset-summary.queries'
import { PrettyException } from '@/components/ui/error'

export const Route = createFileRoute('/(pages)/(user)/favorites')({
  component: FavoritesPage,
  loader: async ({ context }) => {
    const edges = await context.queryClient.ensureInfiniteQueryData(
      getUserFavoritesEdgesOptions(),
    )
    const assetSummaryIds = userFavoritesPagesToAssetIds(edges)
    await context.queryClient.ensureQueryData(
      getAssetSummariesBatchOptions(assetSummaryIds),
    )
  },
})

export function FavoritesPage() {
  const navigate = useNavigate()
  const favoritesResult = useUserFavoriteAssetIds()
  const assetSummariesResult = useAssetSummariesBatch(favoritesResult.data)

  if (favoritesResult.isError || assetSummariesResult.isError) {
    return (
      <PrettyException
        error={favoritesResult.error || assetSummariesResult.error}
        headingLevel={1}
      />
    )
  }

  if (favoritesResult.isPending) {
    return <p>Loading favorites...</p>
  }

  if (favoritesResult.data.length === 0) {
    return (
      <p>
        No favorites yet. <StarIcon aria-label="star" /> some pics!
      </p>
    )
  }

  // can't combine with favorites.isPending check since assets query can be disabled and remain pending when there are no favorites
  if (assetSummariesResult.isPending) {
    return <p>Loading favorites...</p>
  }

  // NOTE: assetSummariesResult.isFetching is not strictly accurate since it can fetch in the background for existing data - though it doesn't currently
  return (
    <InfiniteLoader
      isFetchingNextPage={
        favoritesResult.isFetchingNextPage || assetSummariesResult.isFetching
      }
      fetchNextPage={favoritesResult.fetchNextPage}
      hasNextPage={favoritesResult.hasNextPage}
      loadedCount={assetSummariesResult.data.length}
      uiResetKey="favorites"
      css={{ width: '100%' }}
    >
      <HybridGrid css={{ width: '100%' }} items={assetSummariesResult.data}>
        {(item, itemProps) => (
          <HybridGridItem
            item={item}
            onRowAction={() => {
              navigate({
                to: `/assets/$assetId`,
                params: { assetId: item.externalId },
              })
            }}
            {...itemProps}
          >
            <AssetTile asset={item} />
          </HybridGridItem>
        )}
      </HybridGrid>
    </InfiniteLoader>
  )
}
