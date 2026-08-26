import { Outlet, createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { AssetViewingOverlay } from './-components/asset-viewing-overlay'
import { MAIN_CONTENT_ID, pageMainCss } from '@/components/page-main'
import { AuthModalController } from '@/features/auth/components/auth-modal-controller'
import { useEnsureProfileExists } from '@/features/profiles/hooks/use-ensure-profile-exists'

export const Route = createFileRoute('/(public)/(pages)')({
  component: PublicPagesLayout,
})

function PublicPagesLayout() {
  useEnsureProfileExists()
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
