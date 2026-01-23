import { Outlet, createFileRoute } from '@tanstack/react-router'
import { authPageSearchParamsSchema } from '@/features/auth/schemas'

export const Route = createFileRoute('/(auth)')({
  validateSearch: authPageSearchParamsSchema,
  component: AuthLayout,
  staticData: { authInteractionStrategy: 'page' },
})

function AuthLayout() {
  return (
    <main
      css={{
        flexGrow: 1,
        height: '100%',
        paddingTop: '10rem',
      }}
    >
      <div
        css={{
          maxWidth: '500px',
          margin: '0 auto',
          backgroundColor: 'var(--tertiary-bg)',
          padding: '1rem',
        }}
      >
        <Outlet />
      </div>
    </main>
  )
}
