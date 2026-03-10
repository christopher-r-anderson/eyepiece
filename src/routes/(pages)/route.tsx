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
        maxWidth: '1200px',
        flexGrow: 1,
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Outlet />
      <AuthModalController modal={search} />
    </main>
  )
}
