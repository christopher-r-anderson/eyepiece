import { mapSupabaseAuthError } from './auth.utils'
import type { Result } from '@/lib/result'
import type { SupabaseClient } from '@/integrations/supabase/types'
import { Err, Ok } from '@/lib/result'

export interface AuthCommands {
  login: (credentials: {
    email: string
    password: string
  }) => Promise<Result<void>>

  resetPassword: (options: {
    email: string
    redirectTo: string
  }) => Promise<Result<void>>

  register: (options: {
    email: string
    displayName: string
    password: string
    redirectTo: string
  }) => Promise<Result<void>>

  resendRegisterConfirmation: (options: {
    email: string
    redirectTo: string
  }) => Promise<Result<void>>

  updatePassword: (options: { password: string }) => Promise<Result<void>>
}

export function makeAuthCommands(client: SupabaseClient) {
  return {
    login: async (credentials: {
      email: string
      password: string
    }): Promise<Result<void>> => {
      const { error } = await client.auth.signInWithPassword(credentials)
      return error ? Err(mapSupabaseAuthError(error)) : Ok(undefined)
    },

    resetPassword: async ({
      email,
      redirectTo,
    }: {
      email: string
      redirectTo: string
    }): Promise<Result<void>> => {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      return error ? Err(mapSupabaseAuthError(error)) : Ok(undefined)
    },

    register: async ({
      email,
      displayName,
      password,
      redirectTo,
    }: {
      email: string
      displayName: string
      password: string
      redirectTo: string
    }): Promise<Result<void>> => {
      const { error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: redirectTo,
        },
      })
      return error ? Err(mapSupabaseAuthError(error)) : Ok(undefined)
    },

    resendRegisterConfirmation: async ({
      email,
      redirectTo,
    }: {
      email: string
      redirectTo: string
    }): Promise<Result<void>> => {
      const { error } = await client.auth.resend({
        email,
        type: 'signup',
        options: {
          emailRedirectTo: redirectTo,
        },
      })
      return error ? Err(mapSupabaseAuthError(error)) : Ok(undefined)
    },

    updatePassword: async ({
      password,
    }: {
      password: string
    }): Promise<Result<void>> => {
      const { error } = await client.auth.updateUser({
        password,
      })
      return error ? Err(mapSupabaseAuthError(error)) : Ok(undefined)
    },
  }
}
