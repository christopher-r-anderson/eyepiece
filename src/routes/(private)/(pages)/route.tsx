import { Outlet, createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { pageMainCss } from '@/components/page-main'
import { authModalSearchParamsSchema } from '@/features/auth/auth.schema'
import { userHasProfile } from '@/lib/guards'

export const Route = createFileRoute('/(private)/(pages)')({
  validateSearch: authModalSearchParamsSchema,
  beforeLoad: userHasProfile,
  component: PrivatePagesLayout,
})

function PrivatePagesLayout() {
  return (
    <main className={css(pageMainCss)}>
      <Outlet />
    </main>
  )
}
