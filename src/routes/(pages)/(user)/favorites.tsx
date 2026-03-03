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
import { makeUserFavoritesRepo } from '@/features/favorites/favorites-repo'
import { createUserSupabaseClient } from '@/integrations/supabase/user'
import { makeAssetSummariesRepo } from '@/features/assets/asset-summaries-repo'
import { createPublicSupabaseClient } from '@/integrations/supabase/public'

export const Route = createFileRoute('/(pages)/(user)/favorites')({
  component: FavoritesPage,
  loader: async ({ context }) => {
    const userFavoritesRepo = makeUserFavoritesRepo(createUserSupabaseClient())
    const edges = await context.queryClient.ensureInfiniteQueryData(
      getUserFavoritesEdgesOptions({ repo: userFavoritesRepo }),
    )
    const assetSummaryIds = userFavoritesPagesToAssetIds(edges)
    const assetSummariesRepo = makeAssetSummariesRepo(
      createPublicSupabaseClient(),
    )
    await context.queryClient.ensureQueryData(
      getAssetSummariesBatchOptions({
        assetSummaryIds,
        repo: assetSummariesRepo,
      }),
    )
  },
})

export function FavoritesPage() {
  const navigate = useNavigate()
  const userFavoritesRepo = makeUserFavoritesRepo(createUserSupabaseClient())
  const favoritesResult = useUserFavoriteAssetIds({ repo: userFavoritesRepo })
  const assetSummariesRepo = makeAssetSummariesRepo(
    createPublicSupabaseClient(),
  )
  const assetSummariesResult = useAssetSummariesBatch({
    assetSummaryIds: favoritesResult.data,
    repo: assetSummariesRepo,
  })

  if (favoritesResult.isError || assetSummariesResult.isError) {
    return (
      <PrettyException
        error={favoritesResult.error || assetSummariesResult.error}
        headingLevel={1}
      />
    )
  }

  if (favoritesResult.isPending || assetSummariesResult.isPending) {
    return <p>Loading favorites...</p>
  }

  if (favoritesResult.data.length === 0) {
    return (
      <p>
        No favorites yet. <StarIcon aria-label="star" /> some pics!
      </p>
    )
  }

  return (
    <InfiniteLoader
      isFetchingNextPage={
        favoritesResult.isFetchingNextPage || assetSummariesResult.isLoading
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
