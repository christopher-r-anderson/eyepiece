import { useRouteContext } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { AuthProvider } from '@/features/auth/auth.provider'
import { EyepieceClientProvider } from '@/lib/eyepiece-api-client/eyepiece-client-provider'
import { RouterProvider } from '@/integrations/react-aria-components/router-provider'
import { PublicSupabaseClientProvider } from '@/integrations/supabase/providers/public-provider'
import { UserSupabaseClientProvider } from '@/integrations/supabase/providers/user-provider'
import { Provider as TanstackQueryProvider } from '@/integrations/tanstack-query/root-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  // Note: three separate calls because you can't structurally share non JSON in select
  const publicSupabaseClient = useRouteContext({
    from: '__root__',
    select: (context) => context.publicSupabaseClient,
  })
  const userSupabaseClient = useRouteContext({
    from: '__root__',
    select: (context) => context.userSupabaseClient,
  })
  const queryClient = useRouteContext({
    from: '__root__',
    select: (context) => context.queryClient,
  })
  const eyepieceClient = useRouteContext({
    from: '__root__',
    select: (context) => context.eyepieceClient,
  })
  return (
    <PublicSupabaseClientProvider publicSupabaseClient={publicSupabaseClient}>
      <UserSupabaseClientProvider userSupabaseClient={userSupabaseClient}>
        <TanstackQueryProvider queryClient={queryClient}>
          <AuthProvider>
            <RouterProvider>
              <EyepieceClientProvider eyepieceClient={eyepieceClient}>
                <ThemeProvider>{children}</ThemeProvider>
              </EyepieceClientProvider>
            </RouterProvider>
          </AuthProvider>
        </TanstackQueryProvider>
      </UserSupabaseClientProvider>
    </PublicSupabaseClientProvider>
  )
}
