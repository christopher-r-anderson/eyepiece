import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo } from 'react'
import { useRouteContext, useRouter } from '@tanstack/react-router'
import { onUserChange } from './auth.events'
import { makeAuthCommands } from './auth.commands'
import { authKeys } from './auth.queries'
import type { AuthCommands } from './auth.commands'
import type { ReactNode } from 'react'
import { meKey } from '@/lib/query-keys'

function useAuthSubscription() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const supabaseClient = useRouteContext({
    from: '__root__',
    select: (context) => context.userSupabaseClient,
  })
  useEffect(() => {
    return onUserChange(supabaseClient, (user) => {
      queryClient.setQueryData(authKeys.user(), user)
      queryClient.removeQueries({
        queryKey: meKey,
      })
      router.invalidate()
    })
  }, [queryClient, supabaseClient, router])
}

type AuthContextValue = {
  commands: AuthCommands
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  useAuthSubscription()
  const client = useRouteContext({
    from: '__root__',
    select: (context) => context.userSupabaseClient,
  })
  const commands = useMemo(() => makeAuthCommands(client), [client])
  return (
    <AuthContext.Provider value={{ commands }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
