import { Outlet, createFileRoute } from '@tanstack/react-router'
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
      css={{
        width: '100%',
        maxWidth: 'var(--size-content-max)',
        flexGrow: 1,
        margin: '0 auto',
        padding: '0 var(--space-4) var(--space-7)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}
    >
      <Outlet />
    </main>
  )
}
