import { Outlet, createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { AssetViewingOverlay } from '../../(public)/(pages)/-components/asset-viewing-overlay'
import { pageMainCss } from '@/components/page-main'
import {
  authModalSearchParamsSchema,
  authModalStateSchema,
} from '@/features/auth/auth.schema'
import { AuthModalController } from '@/features/auth/components/auth-modal-controller'
import { userHasProfile } from '@/app/guards'

export const Route = createFileRoute('/(private)/(pages)')({
  validateSearch: authModalSearchParamsSchema,
  beforeLoad: userHasProfile,
  component: PrivatePagesLayout,
})

function PrivatePagesLayout() {
  const search = Route.useSearch({ select: authModalStateSchema.parse })
  return (
    <>
      <main className={css(pageMainCss)}>
        <Outlet />
      </main>
      <AuthModalController modal={search} />
      <AssetViewingOverlay />
    </>
  )
}
