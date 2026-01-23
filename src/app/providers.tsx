import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { AuthProvider } from '@/features/auth/auth-provider'
import { RouterProvider } from '@/integrations/react-aria-components/router-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RouterProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </RouterProvider>
    </AuthProvider>
  )
}
