import { Err, Ok } from './types'
import type { Result, User } from './types'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export async function getUser(): Promise<User | null> {
  const supabase = createSupabaseBrowserClient()
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
  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase.auth.signInWithPassword(credentials)
  return error ? Err(error.message) : Ok()
}

export async function resetPassword({
  email,
  redirectTo,
}: {
  email: string
  redirectTo: string
}): Promise<Result<void>> {
  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
  return error ? Err(error.message) : Ok()
}

export async function register({
  email,
  familyName,
  givenName,
  password,
  redirectTo,
}: {
  email: string
  familyName: string
  givenName: string
  password: string
  redirectTo: string
}): Promise<Result<void>> {
  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        family_name: familyName,
        given_name: givenName,
      },
      emailRedirectTo: redirectTo,
    },
  })
  return error ? Err(error.message) : Ok()
}

export async function resendRegisterConfirmation({
  email,
  redirectTo,
}: {
  email: string
  redirectTo: string
}): Promise<Result<void>> {
  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase.auth.resend({
    email,
    type: 'signup',
    options: {
      emailRedirectTo: redirectTo,
    },
  })
  return error ? Err(error.message) : Ok()
}

export async function updatePassword({
  password,
}: {
  password: string
}): Promise<Result<void>> {
  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase.auth.updateUser({
    password,
  })
  return error ? Err(error.message) : Ok()
}

export function onUserChange(callback: (user: User | null) => void) {
  const supabase = createSupabaseBrowserClient()
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
    givenName: supabaseUser.user_metadata.given_name,
    familyName: supabaseUser.user_metadata.family_name,
  }
}
