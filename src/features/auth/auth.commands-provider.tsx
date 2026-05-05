import { createContext, useContext, useMemo } from 'react'
import { makeAuthCommands } from './auth.commands'
import type { AuthCommands } from './auth.commands'
import type { ReactNode } from 'react'
import { createUserSupabaseClient } from '@/integrations/supabase/user'

type AuthCommandsContextValue = {
  commands: AuthCommands
}

const AuthCommandsContext = createContext<AuthCommandsContextValue | null>(null)

export function AuthCommandsProvider({ children }: { children: ReactNode }) {
  // Creates its own user Supabase client directly so this provider is self-sufficient
  // and can be mounted anywhere without requiring UserSupabaseClientProvider in the tree.
  // Multiple provider instances are expected (for example shell-level providers and
  // isolated client islands). This is intentionally safe because each instance only
  // exposes command helpers and does not maintain cross-provider mutable state.
  // Auth operations (login, logout, etc.) are always triggered by user interaction
  // in the browser, so the isomorphic client correctly resolves to the browser client.
  const client = useMemo(() => createUserSupabaseClient(), [])
  const commands = useMemo(() => makeAuthCommands(client), [client])

  return (
    <AuthCommandsContext.Provider value={{ commands }}>
      {children}
    </AuthCommandsContext.Provider>
  )
}

export function useAuthCommands() {
  const context = useContext(AuthCommandsContext)
  if (!context) {
    throw new Error(
      'useAuthCommands must be used within an AuthCommandsProvider',
    )
  }

  return context
}
