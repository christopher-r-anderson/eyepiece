import { createFileRoute } from '@tanstack/react-router'
import { StarIcon } from '@phosphor-icons/react/dist/ssr'
import { startTransition, useCallback, useMemo, useRef, useState } from 'react'
import { css } from 'styled-system/css'
import type { FavoriteEdge } from '@/features/favorites/favorites.schema'
import type { AssetPreviewSnapshot } from '@/domain/asset/asset.schema'
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
import { RouteError } from '@/app/layout/route-error'
import { AddToCollectionButton } from '@/app/add-to-collection-button'
import { PageHeading } from '@/components/page-heading'
import { AssetGridSkeleton } from '@/features/assets/components/asset-grid-skeleton'
import { Button } from '@/components/ui/button'
import { ToggleButton } from '@/components/ui/toggle-button'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { createUserSupabaseClient } from '@/integrations/supabase/user'
import { useItemOperationQueue } from '@/lib/hooks/use-item-operation-queue'
import { useShowLoginModal } from '@/features/auth/hooks/use-show-auth-modal'
import { ToggleFavoriteErrorCodes } from '@/features/favorites/favorites.const'

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

// ghost rows: an unstarred tile keeps its slot dimmed with an always-visible
// veil so justified rows never re-break and undo stays in place
const ghostTileCss = css({
  '& [data-tile-primary-link]': { pointerEvents: 'none' },
  '& img': { opacity: 0.3 },
  '& [data-tile-reveal], & [data-tile-controls]': {
    opacity: 1,
    translate: 'none',
  },
  '& [data-tile-controls]': { pointerEvents: 'auto' },
})

function FavoritesPage() {
  const favoritesResult = useSuspenseInfiniteUserFavoriteEdges()
  const assetPreviewSnapshotsResult = useAssetPreviewSnapshotsBatch(
    favoritesResult.data.edges.map((edge) => edge.assetPreviewSnapshotId),
  )
  const unfavorite = useUnfavorite()
  const refavoriteAt = useRefavoriteAt()
  const queueToastMessage = useQueueToastMessage()
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const { enqueue, nextIntent, isCurrentIntent } = useItemOperationQueue()
  const showLoginModal = useShowLoginModal()
  // rollback target for a failed operation: the last state the server
  // CONFIRMED, not the state the failed op assumed - its predecessor in
  // the queue may itself have failed (e.g. expired session), so blindly
  // inverting would ghost an item that was never removed
  const confirmedRemovedRef = useRef(new Set<string>())
  const rollBackToConfirmed = useCallback((id: string) => {
    setRemovedIds((prev) => {
      const shouldBeRemoved = confirmedRemovedRef.current.has(id)
      if (shouldBeRemoved === prev.has(id)) {
        return prev
      }
      const next = new Set(prev)
      if (shouldBeRemoved) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

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

  const tileClassName = useCallback(
    (item: AssetPreviewSnapshot) =>
      removedIds.has(item.id) ? ghostTileCss : undefined,
    [removedIds],
  )

  const tileLinkDisabled = useCallback(
    (item: AssetPreviewSnapshot) => removedIds.has(item.id),
    [removedIds],
  )

  const tileActions = useCallback(
    (item: AssetPreviewSnapshot) => {
      const edge = edgesBySnapshotId.get(item.id)
      if (!edge) {
        return undefined
      }
      if (removedIds.has(item.id)) {
        return (
          <span
            className={css({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2',
            })}
          >
            Removed
            <Button
              variant="bare"
              className={css({ textDecoration: 'underline' })}
              onPress={() => {
                setRemovedIds((prev) => {
                  const next = new Set(prev)
                  next.delete(item.id)
                  return next
                })
                const token = nextIntent(item.id)
                enqueue(item.id, () =>
                  refavoriteAt
                    .mutateAsync({
                      assetKey: edge.assetKey,
                      createdAt: edge.createdAt,
                    })
                    .then(
                      () => {
                        confirmedRemovedRef.current.delete(item.id)
                      },
                      (error: unknown) => {
                        if (!isCurrentIntent(item.id, token)) {
                          return
                        }
                        rollBackToConfirmed(item.id)
                        if (
                          error instanceof Error &&
                          error.message ===
                            ToggleFavoriteErrorCodes.AUTH_REQUIRED
                        ) {
                          showLoginModal()
                          return
                        }
                        queueToastMessage({
                          title: 'Undo failed',
                          description: 'Please try again.',
                        })
                      },
                    ),
                )
              }}
            >
              Undo
            </Button>
          </span>
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
              setRemovedIds((prev) => new Set(prev).add(item.id))
              const token = nextIntent(item.id)
              enqueue(item.id, () =>
                unfavorite.mutateAsync(edge.assetKey).then(
                  () => {
                    confirmedRemovedRef.current.add(item.id)
                  },
                  (error: unknown) => {
                    if (!isCurrentIntent(item.id, token)) {
                      return
                    }
                    rollBackToConfirmed(item.id)
                    if (
                      error instanceof Error &&
                      error.message === ToggleFavoriteErrorCodes.AUTH_REQUIRED
                    ) {
                      showLoginModal()
                      return
                    }
                    queueToastMessage({
                      title: 'Unstar failed',
                      description: 'Please try again.',
                    })
                  },
                ),
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
      enqueue,
      nextIntent,
      isCurrentIntent,
      unfavorite,
      refavoriteAt,
      queueToastMessage,
      showLoginModal,
      rollBackToConfirmed,
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
