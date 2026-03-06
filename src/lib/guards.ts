import { redirect } from '@tanstack/react-router'
import type { ParsedLocation } from '@tanstack/react-router'
import { getUser } from '@/features/auth/get-user'
import { urlToNextParam } from '@/lib/utils'
import { hasServerClaims } from '@/server/lib/has-server-claims'
import { makeProfilesRepo } from '@/features/profiles/profiles.repo'
import { createPublicSupabaseClient } from '@/integrations/supabase/public'

export async function requireAuthenticated({
  location,
}: {
  location: ParsedLocation
}) {
  const isValid = await hasServerClaims()
  if (!isValid) {
    throw redirect({
      to: '/login',
      search: { next: urlToNextParam(location.href) },
    })
  }
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
  location,
}: {
  location: ParsedLocation
}) {
  const user = await getUser()
  const repo = makeProfilesRepo(createPublicSupabaseClient())
  if (user) {
    const { data: profile } = await repo.getProfile(user.id)
    if (!profile) {
      throw redirect({
        to: '/complete-profile',
        search: { next: urlToNextParam(location.href) },
      })
    }
  }
}
