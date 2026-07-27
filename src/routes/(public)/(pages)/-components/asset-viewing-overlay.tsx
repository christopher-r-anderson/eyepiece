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

// the tile (or its grid row) that opened the overlay, for focus restore -
// an asset key alone is ambiguous when the same asset sits in two strips
let originElement: Element | null = null

// Tile links that open the overlay: the entry stays on the list route with
// the asset in history state, while the displayed URL is masked to the real
// detail route - copy/share and reload (unmaskOnReload) land on the full
// page, so the overlay only ever opens by push.
export function viewingAssetLinkProps(assetKey: AssetKey): TileLinkProps {
  return {
    to: '.',
    search: (current: Record<string, unknown>) => current,
    resetScroll: false,
    // the link's real destination is the list route itself; without this
    // the router would mark every tile aria-current="page"
    omitActiveProps: true,
    state: (prev: HistoryState) => {
      // runs synchronously inside the opening interaction, before the
      // sheet takes focus
      originElement = document.activeElement
      return { ...prev, viewingAsset: assetKey, dialogPushed: true }
    },
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
    const captured = originElement
    originElement = null
    requestAnimationFrame(() => {
      if (captured instanceof HTMLElement && captured.isConnected) {
        captured.focus()
        return
      }
      const key = toAssetKeyString(lastViewed)
      const fallback =
        document.querySelector<HTMLElement>(
          `[role="row"][data-key="${CSS.escape(key)}"]`,
        ) ??
        document.querySelector<HTMLElement>(
          `[data-tile-primary-link][data-asset-key="${CSS.escape(key)}"]`,
        )
      fallback?.focus()
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

  // the masked URL shows the detail route, so the tab title follows it. A
  // nested navigation (auth modal, picker) makes the router head re-apply
  // the list title, so the effect also re-runs per location; the saved
  // title only updates when someone else wrote it
  const locationHref = useRouterState({ select: (s) => s.location.href })
  const appliedTitleRef = useRef<string | undefined>(undefined)
  const previousTitleRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (document.title !== appliedTitleRef.current) {
      previousTitleRef.current = document.title
    }
    const next = getTitleText(data.title)
    appliedTitleRef.current = next
    document.title = next
  }, [data.title, locationHref])
  useEffect(() => {
    return () => {
      if (previousTitleRef.current !== undefined) {
        document.title = previousTitleRef.current
      }
    }
  }, [])

  return (
    <AssetDetailSurface
      asset={data}
      titleLevel={2}
      imageViewTransitionName={false}
      actions={
        <>
          <FavoriteButton assetKey={assetKey} />
          <AddToCollectionButton assetKey={assetKey} variant="detail" />
        </>
      }
    />
  )
}
