import { createFileRoute } from '@tanstack/react-router'
import { StarIcon } from '@phosphor-icons/react/dist/ssr'
import { startTransition } from 'react'
import { css } from 'styled-system/css'
import { AssetGrid } from '@/features/assets/components/asset-grid'
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
import { RouteError } from '@/app/layout/route-error'
import { PageHeading } from '@/routes/-components/page-heading'
import { AssetGridSkeleton } from '@/routes/-components/asset-grid-skeleton'
import { createUserSupabaseClient } from '@/integrations/supabase/user'

const FavoritesHeading = () => <PageHeading>Favorites</PageHeading>

export const Route = createFileRoute('/(private)/(pages)/favorites')({
  component: FavoritesPage,
  loader: async ({ context }) => {
    // Isomorphic: per-request server client on SSR, browser singleton on SPA
    // navigations. Auth is already enforced by the (private) boundary.
    const edges = await ensureInfiniteUserFavoritesEdges({
      queryClient: context.queryClient,
      userSupabaseClient: createUserSupabaseClient(),
    })
    const assetPreviewSnapshotIds = userFavoritesPagesToAssetIds(edges)
    await ensureAssetPreviewSnapshotsBatch({
      assetPreviewSnapshotIds,
      queryClient: context.queryClient,
      publicSupabaseClient: context.publicSupabaseClient,
    })
  },
  errorComponent: ({ error }) => (
    <RouteError
      error={error}
      heading={<FavoritesHeading />}
      message="Error loading favorites."
    />
  ),
  pendingComponent: () => (
    <>
      <FavoritesHeading />
      <AssetGridSkeleton />
    </>
  ),
})

function FavoritesPage() {
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
        className={css({ width: '100%' })}
      >
        <AssetGrid items={assetSummariesResult.data ?? []} />
      </InfiniteLoader>
    </>
  )
}
