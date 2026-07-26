import { Suspense } from 'react'
import { useNavigate, useRouter, useRouterState } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
import { AssetDetail } from '../../assets/-components/asset-detail'
import { FavoriteButton } from '../../-components/favorite-button'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { AddToCollectionButton } from '@/app/add-to-collection-button'
import { ModalDialog } from '@/components/ui/modal-dialog'
import { Link } from '@/components/ui/link'
import { useSuspenseAsset } from '@/features/assets/assets.queries'

// SPIKE (overlay route masking): renders the asset a list entry is
// "viewing" as a modal above the still-mounted list. The entry's displayed
// URL is masked to the real detail route, so share/reload land on the full
// page (unmaskOnReload) and this overlay only ever opens by push.
export function AssetViewingOverlay() {
  const viewingAsset = useRouterState({
    select: (s) => s.location.state.viewingAsset,
  })
  const openedByPush = useRouterState({
    select: (s) => !!s.location.state.dialogPushed,
  })
  const router = useRouter()
  const navigate = useNavigate()

  const close = () => {
    if (openedByPush) {
      router.history.back()
      return
    }
    void navigate({
      to: '.',
      search: (current: unknown) => current as never,
      replace: true,
      viewTransition: false,
      state: (prev) => ({
        ...prev,
        viewingAsset: undefined,
        dialogPushed: undefined,
      }),
    })
  }

  return (
    <ModalDialog
      isOpen={!!viewingAsset}
      onOpenChange={(shouldOpen) => {
        if (!shouldOpen) {
          close()
        }
      }}
      title="Asset"
      isDismissable
    >
      {viewingAsset && (
        <Suspense fallback={<p>Loading asset...</p>}>
          <OverlayAssetContent assetKey={viewingAsset} />
        </Suspense>
      )}
    </ModalDialog>
  )
}

function OverlayAssetContent({ assetKey }: { assetKey: AssetKey }) {
  const { data } = useSuspenseAsset(assetKey)
  return (
    <div className={css({ display: 'grid', gap: '3' })}>
      <div
        className={flex({
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '3',
        })}
      >
        <p className={css({ minWidth: 0, overflowWrap: 'anywhere' })}>
          {data.title}
        </p>
        <div
          className={flex({ alignItems: 'center', gap: '2', flexShrink: 0 })}
        >
          <FavoriteButton assetKey={assetKey} />
          <AddToCollectionButton assetKey={assetKey} variant="tile" />
          <Link
            to="/assets/$providerId/$assetId"
            params={{
              providerId: assetKey.providerId,
              assetId: assetKey.externalId,
            }}
          >
            Full page
          </Link>
        </div>
      </div>
      <AssetDetail asset={data} />
    </div>
  )
}
