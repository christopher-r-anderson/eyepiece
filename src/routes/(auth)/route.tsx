import { Outlet, createFileRoute } from '@tanstack/react-router'
import { authPageSearchParamsSchema } from '@/features/auth/auth.schema'

export const Route = createFileRoute('/(auth)')({
  validateSearch: authPageSearchParamsSchema,
  component: AuthLayout,
  staticData: { authInteractionStrategy: 'page' },
})

function AuthLayout() {
  return (
    <main
      css={{
        width: '100%',
        maxWidth: 'var(--size-content-max)',
        flexGrow: 1,
        margin: '0 auto',
        padding:
          'clamp(var(--space-6), 12vh, 10rem) var(--space-4) var(--space-7)',
      }}
    >
      <div
        css={{
          width: '100%',
          maxWidth: '32rem',
          margin: '0 auto',
          backgroundColor: 'var(--tertiary-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          padding: 'var(--space-4)',
        }}
      >
        <Outlet />
      </div>
    </main>
  )
}
