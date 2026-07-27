import { Suspense, useEffect, useRef } from 'react'
import {
  CatchBoundary,
  useNavigate,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { FavoriteButton } from './favorite-button'
import type { HistoryState } from '@tanstack/react-router'
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { TileLinkProps } from '@/features/assets/components/asset-tile'
import { AddToCollectionButton } from '@/app/add-to-collection-button'
import { AssetDetailSurface } from '@/app/asset-detail-surface'
import { CapturedAlertError } from '@/app/layout/route-error'
import { Sheet } from '@/components/ui/sheet'
import { useSuspenseAsset } from '@/features/assets/assets.queries'
import { toAssetKeyString } from '@/domain/asset/asset.utils'
import { getTitleText } from '@/lib/utils'

// Tile links that open the overlay: the entry stays on the list route with
// the asset in history state, while the displayed URL is masked to the real
// detail route - copy/share and reload (unmaskOnReload) land on the full
// page, so the overlay only ever opens by push.
export function viewingAssetLinkProps(assetKey: AssetKey): TileLinkProps {
  return {
    to: '.',
    search: (current: Record<string, unknown>) => current,
    resetScroll: false,
    state: (prev: HistoryState) => ({
      ...prev,
      viewingAsset: assetKey,
      dialogPushed: true,
    }),
    mask: {
      to: '/assets/$providerId/$assetId',
      params: {
        providerId: assetKey.providerId,
        assetId: assetKey.externalId,
      },
      unmaskOnReload: true,
    },
  } as unknown as TileLinkProps
}

export function AssetViewingOverlay() {
  const viewingAsset = useRouterState({
    select: (s) => s.location.state.viewingAsset,
  })
  const openedByPush = useRouterState({
    select: (s) => !!s.location.state.dialogPushed,
  })
  const router = useRouter()
  const navigate = useNavigate()

  // on close, focus returns to the origin tile: RAC's own restore cannot
  // reach it across the router state change
  const lastViewedRef = useRef<AssetKey | undefined>(undefined)
  useEffect(() => {
    if (viewingAsset) {
      lastViewedRef.current = viewingAsset
      return
    }
    const lastViewed = lastViewedRef.current
    if (!lastViewed) {
      return
    }
    lastViewedRef.current = undefined
    requestAnimationFrame(() => {
      const key = toAssetKeyString(lastViewed)
      const origin =
        document.querySelector<HTMLElement>(
          `[role="row"][data-key="${CSS.escape(key)}"]`,
        ) ??
        document.querySelector<HTMLElement>(
          `[data-tile-primary-link][data-asset-key="${CSS.escape(key)}"]`,
        )
      origin?.focus()
    })
  }, [viewingAsset])

  const close = () => {
    if (openedByPush) {
      router.history.back()
      return
    }
    void navigate({
      to: '.',
      search: (current: unknown) => current as never,
      replace: true,
      state: (prev) => ({
        ...prev,
        viewingAsset: undefined,
        dialogPushed: undefined,
      }),
    })
  }

  return (
    <Sheet
      isOpen={!!viewingAsset}
      onOpenChange={(shouldOpen) => {
        if (!shouldOpen) {
          close()
        }
      }}
      aria-label="Asset detail"
    >
      {viewingAsset && (
        <CatchBoundary
          getResetKey={() => toAssetKeyString(viewingAsset)}
          errorComponent={({ error }) => (
            <CapturedAlertError
              error={error}
              message="Couldn't load this asset."
              captureContext={{
                boundaryKind: 'catch',
                feature: 'assets',
                providerId: viewingAsset.providerId,
                operation: 'load_asset_overlay',
              }}
            />
          )}
        >
          <Suspense
            fallback={
              <p role="status" className={css({ marginTop: '8' })}>
                Loading asset...
              </p>
            }
          >
            <OverlayAssetContent assetKey={viewingAsset} />
          </Suspense>
        </CatchBoundary>
      )}
    </Sheet>
  )
}

function OverlayAssetContent({ assetKey }: { assetKey: AssetKey }) {
  const { data } = useSuspenseAsset(assetKey)

  // the masked URL shows the detail route, so the tab title follows it;
  // the route's own head re-applies after close via the restored title
  useEffect(() => {
    const previousTitle = document.title
    document.title = getTitleText(data.title)
    return () => {
      document.title = previousTitle
    }
  }, [data.title])

  return (
    <AssetDetailSurface
      asset={data}
      titleLevel={2}
      actions={
        <>
          <FavoriteButton assetKey={assetKey} />
          <AddToCollectionButton assetKey={assetKey} variant="detail" />
        </>
      }
    />
  )
}
