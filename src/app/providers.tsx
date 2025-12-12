import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme/theme-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
