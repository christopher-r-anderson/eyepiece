import { createFileRoute } from '@tanstack/react-router'
import { StarIcon } from '@phosphor-icons/react/dist/ssr'
import { startTransition, useCallback, useMemo } from 'react'
import { css } from 'styled-system/css'
import { useViewingAssetTileLinkProps } from '../../(public)/(pages)/-components/asset-viewing-overlay'
import type { FavoriteEdge } from '@/features/favorites/favorites.schema'
import type {
  AssetKey,
  AssetPreviewSnapshot,
} from '@/domain/asset/asset.schema'
import { isAuthRequiredError } from '@/lib/result'
import { JustifiedAssetGrid } from '@/features/assets/components/justified-asset-grid'
import {
  ensureInfiniteUserFavoritesEdges,
  useRefavoriteAt,
  useSuspenseInfiniteUserFavoriteEdges,
  useUnfavorite,
  userFavoritesPagesToAssetIds,
} from '@/features/favorites/favorites.queries'
import { favoriteToggleCss } from '@/features/favorites/components/toggle-favorite-button'
import { InfiniteLoader } from '@/components/infinite-loader/infinite-loader'
import {
  ensureAssetPreviewSnapshotsBatch,
  useAssetPreviewSnapshotsBatch,
} from '@/features/assets/asset-preview-snapshots.queries'
import {
  GhostRemovedActions,
  refocusTileControlAfterSwap,
  useGhostRemovals,
} from '@/features/assets/components/ghost-removals'
import { toAssetKeyString } from '@/domain/asset/asset.utils'
import { RouteError } from '@/app/layout/route-error'
import { AddToCollectionButton } from '@/app/add-to-collection-button'
import { PageHeading } from '@/components/page-heading'
import { AssetGridSkeleton } from '@/features/assets/components/asset-grid-skeleton'
import { ToggleButton } from '@/components/ui/toggle-button'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { createUserSupabaseClient } from '@/integrations/supabase/user'
import { useShowLoginModal } from '@/features/auth/hooks/use-show-auth-modal'

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
  const tileLinkProps = useViewingAssetTileLinkProps()
  const favoritesResult = useSuspenseInfiniteUserFavoriteEdges()
  const assetPreviewSnapshotsResult = useAssetPreviewSnapshotsBatch(
    favoritesResult.data.edges.map((edge) => edge.assetPreviewSnapshotId),
  )
  // mutateAsync alone: the mutation result object is fresh every render
  // and would defeat the grid rows' memo through the tileActions identity
  const { mutateAsync: unfavoriteAsync } = useUnfavorite()
  const { mutateAsync: refavoriteAtAsync } = useRefavoriteAt()
  const queueToastMessage = useQueueToastMessage()
  const showLoginModal = useShowLoginModal()
  const {
    removedIds,
    runRemoval,
    runRestore,
    tileClassName,
    tileLinkDisabled,
  } = useGhostRemovals()
  const makeOpFailureHandler = useCallback(
    (title: string, assetKey: AssetKey) => (error: unknown) => {
      if (isAuthRequiredError(error)) {
        showLoginModal()
        return
      }
      refocusTileControlAfterSwap(toAssetKeyString(assetKey))
      queueToastMessage({ title, description: 'Please try again.' })
    },
    [showLoginModal, queueToastMessage],
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

  const edgesBySnapshotId = useMemo(() => {
    const map = new Map<string, FavoriteEdge>()
    for (const edge of favoritesResult.data.edges) {
      map.set(edge.assetPreviewSnapshotId, edge)
    }
    return map
  }, [favoritesResult.data.edges])

  const tileActions = useCallback(
    (item: AssetPreviewSnapshot) => {
      const edge = edgesBySnapshotId.get(item.id)
      if (!edge) {
        return undefined
      }
      if (removedIds.has(item.id)) {
        return (
          <GhostRemovedActions
            onUndo={() => {
              refocusTileControlAfterSwap(toAssetKeyString(edge.assetKey))
              runRestore(
                item.id,
                () =>
                  refavoriteAtAsync({
                    assetKey: edge.assetKey,
                    createdAt: edge.createdAt,
                  }),
                makeOpFailureHandler('Undo failed', edge.assetKey),
              )
            }}
          />
        )
      }
      return (
        <>
          <ToggleButton
            aria-label="Star"
            css={favoriteToggleCss}
            variant="icon"
            isSelected
            onChange={() => {
              refocusTileControlAfterSwap(toAssetKeyString(edge.assetKey))
              runRemoval(
                item.id,
                () => unfavoriteAsync(edge.assetKey),
                makeOpFailureHandler('Unstar failed', edge.assetKey),
              )
            }}
          >
            <StarIcon size={20} weight="fill" />
          </ToggleButton>
          <AddToCollectionButton assetKey={edge.assetKey} variant="tile" />
        </>
      )
    },
    [
      edgesBySnapshotId,
      removedIds,
      runRemoval,
      runRestore,
      unfavoriteAsync,
      refavoriteAtAsync,
      makeOpFailureHandler,
    ],
  )

  if (favoritesResult.data.total === 0) {
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
        <JustifiedAssetGrid
          tileLinkProps={tileLinkProps}
          aria-label="Favorites"
          items={assetPreviewSnapshotsResult.data ?? []}
          tileActions={tileActions}
          tileClassName={tileClassName}
          tileLinkDisabled={tileLinkDisabled}
        />
      </InfiniteLoader>
    </>
  )
}
