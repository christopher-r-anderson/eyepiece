import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { AuthProvider } from '@/features/auth/auth-provider'
import { EyepieceClientProvider } from '@/lib/eyepiece-api-client/eyepiece-client-provider'
import { RouterProvider } from '@/integrations/react-aria-components/router-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RouterProvider>
        <EyepieceClientProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </EyepieceClientProvider>
      </RouterProvider>
    </AuthProvider>
  )
}
