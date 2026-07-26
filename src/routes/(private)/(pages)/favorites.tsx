import { createFileRoute } from '@tanstack/react-router'
import { StarIcon } from '@phosphor-icons/react/dist/ssr'
import { startTransition } from 'react'
import { css } from 'styled-system/css'
import { JustifiedAssetGrid } from '@/features/assets/components/justified-asset-grid'
import {
  ensureInfiniteUserFavoritesEdges,
  useSuspenseInfiniteUserFavoriteAssetIds,
  userFavoritesPagesToAssetIds,
} from '@/features/favorites/favorites.queries'
import { InfiniteLoader } from '@/components/infinite-loader/infinite-loader'
import {
  ensureAssetPreviewSnapshotsBatch,
  useAssetPreviewSnapshotsBatch,
} from '@/features/assets/asset-preview-snapshots.queries'
import { RouteError } from '@/app/layout/route-error'
import { PageHeading } from '@/components/page-heading'
import { AssetGridSkeleton } from '@/features/assets/components/asset-grid-skeleton'
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
  const assetPreviewSnapshotsResult = useAssetPreviewSnapshotsBatch(
    favoritesResult.data,
  )
  // failed page fetches would otherwise degrade silently: an edge-page
  // error only surfaces on the result once earlier pages exist, and an
  // errored snapshot batch holds no data for its new key so the fallback
  // below would render zero tiles. Both fail over to the route boundary,
  // matching how a first-page failure surfaces from the loader.
  if (favoritesResult.isError) {
    throw favoritesResult.error
  }
  if (assetPreviewSnapshotsResult.isError) {
    throw assetPreviewSnapshotsResult.error
  }

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
        // isFetching, not isLoading: after an edge page lands the batch
        // query switches keys and keepPreviousData reports isLoading
        // false while the new snapshots are still in flight
        isFetchingNextPage={
          favoritesResult.isFetchingNextPage ||
          assetPreviewSnapshotsResult.isFetching
        }
        fetchNextPage={() => {
          startTransition(async () => {
            await favoritesResult.fetchNextPage()
          })
        }}
        hasNextPage={favoritesResult.hasNextPage}
        loadedCount={assetPreviewSnapshotsResult.data?.length ?? 0}
        uiResetKey="favorites"
        className={css({ width: '100%' })}
      >
        <JustifiedAssetGrid items={assetPreviewSnapshotsResult.data ?? []} />
      </InfiniteLoader>
    </>
  )
}
