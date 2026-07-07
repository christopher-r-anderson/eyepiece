import { useMemo } from 'react'
import { makeAuthCommands } from '../auth.commands'
import type { AuthCommands } from '../auth.commands'
import { createUserSupabaseClient } from '@/integrations/supabase/user'

export function useAuthCommands() {
  const commands = useMemo<AuthCommands>(() => {
    // Commands are built lazily at call time: they only ever run from client
    // event handlers, so SSR render must not construct a Supabase client here.
    let lazyCommands: AuthCommands | null = null

    function getCommands() {
      lazyCommands ??= makeAuthCommands(createUserSupabaseClient())
      return lazyCommands
    }

    return {
      login: (credentials) => getCommands().login(credentials),
      resetPassword: (options) => getCommands().resetPassword(options),
      register: (options) => getCommands().register(options),
      resendRegisterConfirmation: (options) =>
        getCommands().resendRegisterConfirmation(options),
      updatePassword: (options) => getCommands().updatePassword(options),
      logout: () => getCommands().logout(),
    }
  }, [])

  return { commands }
}
