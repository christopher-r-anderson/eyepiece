import { Outlet, createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { authModalSearchParamsSchema } from '@/features/auth/auth.schema'
import { userHasProfile } from '@/lib/guards'

export const Route = createFileRoute('/(private)/(pages)')({
  validateSearch: authModalSearchParamsSchema,
  beforeLoad: userHasProfile,
  component: PrivatePagesLayout,
})

function PrivatePagesLayout() {
  return (
    <main
      className={css({
        width: '100%',
        maxWidth: 'contentMax',
        flexGrow: 1,
        margin: '0 auto',
        paddingTop: '0',
        paddingInline: '4',
        paddingBottom: '7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      })}
    >
      <Outlet />
    </main>
  )
}
