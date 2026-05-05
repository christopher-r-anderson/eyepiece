import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AuthCommandsProvider } from '@/features/auth/auth.commands-provider'
import { UserSupabaseClientProvider } from '@/integrations/supabase/providers/user-provider'
import { authenticatedBoundary } from '@/lib/route-boundaries'

export const Route = createFileRoute('/(private)')({
  ...authenticatedBoundary,
  component: PrivateRootLayout,
})

function PrivateRootLayout() {
  // SupabaseClient is non-serializable and cannot be re-typed via beforeLoad returns.
  // Non-null assertion is safe: requireAuthenticatedShell throws before render if the client is null.
  const userSupabaseClient = Route.useRouteContext().userSupabaseClient!
  return (
    <UserSupabaseClientProvider userSupabaseClient={userSupabaseClient}>
      <AuthCommandsProvider>
        <Outlet />
      </AuthCommandsProvider>
    </UserSupabaseClientProvider>
  )
}
