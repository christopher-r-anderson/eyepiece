import { useAuthSubscription } from './auth-queries'
import type { ReactNode } from 'react'

export function AuthProvider({ children }: { children: ReactNode }) {
  useAuthSubscription()
  return <>{children}</>
}
