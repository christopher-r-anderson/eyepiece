import { Outlet, createFileRoute } from '@tanstack/react-router'
import {
  authModalSearchParamsSchema,
  authModalStateSchema,
} from '@/features/auth/auth.schema'
import { AuthCommandsProvider } from '@/features/auth/auth.commands-provider'
import { AuthModalController } from '@/features/auth/components/auth-modal-controller'
import { useEnsureProfileExists } from '@/lib/use-ensure-profile-exists'

export const Route = createFileRoute('/(public)/(pages)')({
  validateSearch: authModalSearchParamsSchema,
  component: PublicPagesLayout,
})

function PublicPagesLayout() {
  useEnsureProfileExists()
  const search = Route.useSearch({ select: authModalStateSchema.parse })
  return (
    <>
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
      <AuthCommandsProvider>
        <AuthModalController modal={search} />
      </AuthCommandsProvider>
    </>
  )
}
