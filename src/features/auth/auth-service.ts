import { mapSupabaseAuthError } from './errors'
import type { User } from './types'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Result } from '@/lib/result'
import { createUserSupabaseBrowserClient } from '@/integrations/supabase/user/browser'
import { Err, Ok } from '@/lib/result'

export async function getUser(): Promise<User | null> {
  const supabase = createUserSupabaseBrowserClient()
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession()
  if (sessionError) {
    throw sessionError
  }
  // don't try to get a user if there's no session, they aren't logged in
  if (!sessionData.session) {
    return null
  }
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    throw error
  }
  return userFromSupabaseUser(data.user)
}

export async function login(credentials: {
  email: string
  password: string
}): Promise<Result<void>> {
  const supabase = createUserSupabaseBrowserClient()
  const { error } = await supabase.auth.signInWithPassword(credentials)
  return error ? Err(mapSupabaseAuthError(error)) : Ok(undefined)
}

export async function resetPassword({
  email,
  redirectTo,
}: {
  email: string
  redirectTo: string
}): Promise<Result<void>> {
  const supabase = createUserSupabaseBrowserClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
  return error ? Err(mapSupabaseAuthError(error)) : Ok(undefined)
}

export async function register({
  email,
  displayName,
  password,
  redirectTo,
}: {
  email: string
  displayName: string
  password: string
  redirectTo: string
}): Promise<Result<void>> {
  const supabase = createUserSupabaseBrowserClient()
  const { error } = await supabase.auth.signUp({
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
}

export async function resendRegisterConfirmation({
  email,
  redirectTo,
}: {
  email: string
  redirectTo: string
}): Promise<Result<void>> {
  const supabase = createUserSupabaseBrowserClient()
  const { error } = await supabase.auth.resend({
    email,
    type: 'signup',
    options: {
      emailRedirectTo: redirectTo,
    },
  })
  return error ? Err(mapSupabaseAuthError(error)) : Ok(undefined)
}

export async function updatePassword({
  password,
}: {
  password: string
}): Promise<Result<void>> {
  const supabase = createUserSupabaseBrowserClient()
  const { error } = await supabase.auth.updateUser({
    password,
  })
  return error ? Err(mapSupabaseAuthError(error)) : Ok(undefined)
}

export function onUserChange(callback: (user: User | null) => void) {
  const supabase = createUserSupabaseBrowserClient()
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ? userFromSupabaseUser(session.user) : null
    callback(user)
  })
  return () => sub.subscription.unsubscribe()
}

function userFromSupabaseUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
  }
}
