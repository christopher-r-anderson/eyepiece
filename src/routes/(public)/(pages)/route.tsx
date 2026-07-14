import { Outlet, createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { pageMainCss } from '@/routes/-components/page-main'
import {
  authModalSearchParamsSchema,
  authModalStateSchema,
} from '@/features/auth/auth.schema'
import { AuthModalController } from '@/features/auth/components/auth-modal-controller'
import { useEnsureProfileExists } from '@/features/profiles/hooks/use-ensure-profile-exists'

export const Route = createFileRoute('/(public)/(pages)')({
  validateSearch: authModalSearchParamsSchema,
  component: PublicPagesLayout,
})

function PublicPagesLayout() {
  useEnsureProfileExists()
  const search = Route.useSearch({ select: authModalStateSchema.parse })
  return (
    <>
      <main className={css(pageMainCss)}>
        <Outlet />
      </main>
      <AuthModalController modal={search} />
    </>
  )
}
