import { redirect } from '@tanstack/react-router'
import type { ParsedLocation } from '@tanstack/react-router'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { QueryClient } from '@tanstack/react-query'
import { getUser } from '@/features/auth/get-user'
import { urlToNextParam } from '@/lib/utils'
import { hasServerClaims } from '@/lib/has-server-claims.functions'
import { fetchCurrentUser } from '@/features/auth/auth.queries'
import { fetchProfile } from '@/features/profiles/profiles.queries'

export async function requireAuthenticated({
  location,
}: {
  location: ParsedLocation
}) {
  const user = await getUser()
  if (!user) {
    throw redirect({
      to: '/login',
      search: { next: urlToNextParam(location.href) },
    })
  }
  return { user }
}

export async function requireAnonymous({
  search,
}: {
  search: { next?: string }
}) {
  const isAuthorized = await hasServerClaims()
  if (isAuthorized) {
    throw redirect({
      to: search.next ? urlToNextParam(search.next) : '/',
      statusCode: 302,
    })
  }
}

export async function userHasProfile({
  context: { publicSupabaseClient, queryClient },
  location,
}: {
  context: { queryClient: QueryClient; publicSupabaseClient: SupabaseClient }
  location: ParsedLocation
}) {
  const user = await fetchCurrentUser({ queryClient })
  if (user) {
    const profile = await fetchProfile({
      id: user.id,
      queryClient,
      publicSupabaseClient,
    })
    if (!profile) {
      throw redirect({
        to: '/complete-profile',
        search: { next: urlToNextParam(location.href) },
      })
    }
  }
}
