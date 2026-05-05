import { useRouteContext } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { AuthStateSync } from '@/features/auth/auth.state-sync'
import { EyepieceClientProvider } from '@/lib/eyepiece-api-client/eyepiece-client-provider'
import { RouterProvider } from '@/integrations/react-aria-components/router-provider'
import { PublicSupabaseClientProvider } from '@/integrations/supabase/providers/public-provider'
import { Provider as TanstackQueryProvider } from '@/integrations/tanstack-query/root-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  // Note: three separate calls because you can't structurally share non JSON in select
  const publicSupabaseClient = useRouteContext({
    from: '__root__',
    select: (context) => context.publicSupabaseClient,
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
      <TanstackQueryProvider queryClient={queryClient}>
        <RouterProvider>
          <EyepieceClientProvider eyepieceClient={eyepieceClient}>
            <ThemeProvider>
              <AuthStateSync />
              {children}
            </ThemeProvider>
          </EyepieceClientProvider>
        </RouterProvider>
      </TanstackQueryProvider>
    </PublicSupabaseClientProvider>
  )
}
