import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo } from 'react'
import { onUserChange } from './auth-events'
import { makeAuthCommands } from './auth-commands'
import type { AuthCommands } from './auth-commands'
import type { ReactNode } from 'react'
import type { UserCacheKey } from './types'
import { meKey } from '@/lib/query-keys'
import { createUserSupabaseClient } from '@/integrations/supabase/user'

function useAuthSubscription() {
  const queryClient = useQueryClient()

  useEffect(() => {
    return onUserChange((user) => {
      queryClient.setQueryData(['auth', 'user'] as UserCacheKey, user)
      queryClient.removeQueries({
        queryKey: meKey,
      })
    })
  }, [queryClient])
}

type AuthContextValue = {
  commands: AuthCommands
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  useAuthSubscription()
  const client = useMemo(() => createUserSupabaseClient(), [])
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
