import { Outlet, createFileRoute } from '@tanstack/react-router'
import {
  authModalSearchParamsSchema,
  authModalStateSchema,
} from '@/features/auth/auth.schema'
import { AuthModalController } from '@/features/auth/components/auth-modal-controller'
import { userHasProfile } from '@/lib/guards'

export const Route = createFileRoute('/(pages)')({
  validateSearch: authModalSearchParamsSchema,
  beforeLoad: userHasProfile,
  component: PagesLayout,
})

function PagesLayout() {
  const search = Route.useSearch({ select: authModalStateSchema.parse })
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
      <AuthModalController modal={search} />
    </main>
  )
}
