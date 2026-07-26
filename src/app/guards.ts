import { isRedirect, redirect } from '@tanstack/react-router'
import type { ParsedLocation } from '@tanstack/react-router'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { QueryClient } from '@tanstack/react-query'
import { getUser } from '@/features/auth/get-user'
import { urlToNextParam } from '@/lib/utils'
import { fetchCurrentUser } from '@/features/auth/auth.queries'
import { fetchProfile } from '@/features/profiles/profiles.queries'
import { logErrorWithObservability } from '@/lib/error-logging'

export async function requireAuthenticated({
  location,
}: {
  location: ParsedLocation
}) {
  try {
    const user = await getUser()
    if (!user) {
      throw redirect({
        to: '/login',
        search: { next: urlToNextParam(location.href) },
      })
    }

    return { user }
  } catch (error) {
    if (isRedirect(error)) {
      throw error
    }

    logErrorWithObservability(
      'Unexpected error in requireAuthenticated',
      error,
      {
        path: location.href,
      },
    )

    throw redirect({
      to: '/login',
      search: { next: urlToNextParam(location.href) },
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
  if (location.pathname === '/complete-profile') {
    return
  }

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
