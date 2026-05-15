import { createContext, useContext, useMemo } from 'react'
import { makeAuthCommands } from './auth.commands'
import type { AuthCommands } from './auth.commands'
import type { ReactNode } from 'react'
import { createUserSupabaseClient } from '@/integrations/supabase/user'
import { useOptionalUserSupabaseClient } from '@/integrations/supabase/providers/user-provider'

type AuthCommandsContextValue = {
  commands: AuthCommands
}

const AuthCommandsContext = createContext<AuthCommandsContextValue | null>(null)

export function AuthCommandsProvider({ children }: { children: ReactNode }) {
  const sharedUserSupabaseClient = useOptionalUserSupabaseClient()
  const commands = useMemo<AuthCommands>(() => {
    if (sharedUserSupabaseClient) {
      return makeAuthCommands(sharedUserSupabaseClient)
    }

    let browserCommands: AuthCommands | null = null

    function getBrowserCommands() {
      browserCommands ??= makeAuthCommands(createUserSupabaseClient())
      return browserCommands
    }

    return {
      login: (credentials) => getBrowserCommands().login(credentials),
      resetPassword: (options) => getBrowserCommands().resetPassword(options),
      register: (options) => getBrowserCommands().register(options),
      resendRegisterConfirmation: (options) =>
        getBrowserCommands().resendRegisterConfirmation(options),
      updatePassword: (options) => getBrowserCommands().updatePassword(options),
      logout: () => getBrowserCommands().logout(),
    }
  }, [sharedUserSupabaseClient])

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
