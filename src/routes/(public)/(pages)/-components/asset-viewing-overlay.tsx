import { Suspense, useCallback, useEffect, useRef } from 'react'
import {
  CatchBoundary,
  useNavigate,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { FavoriteButton } from './favorite-button'
import type { MouseEvent } from 'react'
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

// focus-restore target; an asset key alone is ambiguous when the same
// asset sits in two strips
let originElement: Element | null = null

// Tiles keep their real detail links; a plain activation upgrades into the
// overlay - list route + history state, displayed URL masked to the detail
// route. Modified clicks, copy/share, and reload get the real page.
export function useViewingAssetTileLinkProps() {
  const router = useRouter()
  return useCallback(
    (item: { key: AssetKey }): TileLinkProps => ({
      onClick: (event: MouseEvent<Element>) => {
        if (
          event.defaultPrevented ||
          event.currentTarget.getAttribute('aria-disabled') === 'true' ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }
        event.preventDefault()
        // the active grid row wins for keyboard activation; stale focus
        // elsewhere (pointer modes that do not focus links) must not
        const active = document.activeElement
        originElement =
          active instanceof HTMLElement && active.contains(event.currentTarget)
            ? active
            : event.currentTarget
        void router.navigate({
          to: '.',
          search: (current: unknown) => current as never,
          resetScroll: false,
          state: (prev: HistoryState) => ({
            ...prev,
            viewingAsset: item.key,
            dialogPushed: true,
          }),
          mask: {
            to: '/assets/$providerId/$assetId',
            params: {
              providerId: item.key.providerId,
              assetId: item.key.externalId,
            },
            unmaskOnReload: true,
          },
        })
      },
    }),
    [router],
  )
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

  // RAC's focus restore cannot reach the origin tile across the router
  // state change
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
    // not consumed: history Forward can reopen the entry, and its close
    // should restore the same opener
    const captured = originElement
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

  // the tab title follows the masked URL; nested navigations make the
  // router head re-apply the list title, so this re-runs per location
  const locationHref = useRouterState({ select: (s) => s.location.href })
  const appliedTitleRef = useRef<string | undefined>(undefined)
  const previousTitleRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (document.title !== appliedTitleRef.current) {
      previousTitleRef.current = document.title
    }
    const next = getTitleText(data.title || 'NASA Media')
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
      heightModel="container"
      actions={
        <>
          <FavoriteButton assetKey={assetKey} />
          <AddToCollectionButton assetKey={assetKey} variant="detail" />
        </>
      }
    />
  )
}
