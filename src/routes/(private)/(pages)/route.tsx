import { Outlet, createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { AssetViewingOverlay } from '../../(public)/(pages)/-components/asset-viewing-overlay'
import { MAIN_CONTENT_ID, pageMainCss } from '@/components/page-main'
import { AuthModalController } from '@/features/auth/components/auth-modal-controller'
import { userHasProfile } from '@/app/guards'

export const Route = createFileRoute('/(private)/(pages)')({
  beforeLoad: userHasProfile,
  component: PrivatePagesLayout,
})

function PrivatePagesLayout() {
  return (
    <>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className={css(pageMainCss)}>
        <Outlet />
      </main>
      <AuthModalController />
      <AssetViewingOverlay />
    </>
  )
}
