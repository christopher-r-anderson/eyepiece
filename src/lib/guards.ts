import { isRedirect, redirect } from '@tanstack/react-router'
import type { ParsedLocation } from '@tanstack/react-router'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { QueryClient } from '@tanstack/react-query'
import { getUser } from '@/features/auth/get-user'
import { urlToNextParam } from '@/lib/utils'
import { hasServerClaims } from '@/lib/has-server-claims.functions'
import { fetchCurrentUser } from '@/features/auth/auth.queries'
import { fetchProfile } from '@/features/profiles/profiles.queries'
import { AUTHENTICATED_ROUTE_POLICY } from '@/lib/route-policy'
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

export async function requireAuthenticatedRoute({
  location,
}: {
  location: ParsedLocation
}) {
  const authContext = await requireAuthenticated({ location })
  return {
    ...authContext,
    routePolicy: AUTHENTICATED_ROUTE_POLICY,
  }
}

// SupabaseClient is non-serializable and cannot be re-typed via beforeLoad returns.
// The (private) shell reads it from context directly using a non-null assertion that is safe
// because this guard throws before the component renders if the client is null.
export async function requireAuthenticatedShell({
  context,
  location,
}: {
  context: { userSupabaseClient: SupabaseClient | null }
  location: ParsedLocation
}) {
  const authContext = await requireAuthenticatedRoute({ location })
  if (!context.userSupabaseClient) {
    throw new Error(
      'userSupabaseClient is null at the authenticated capability shell. ' +
        'Ensure no ancestor route in the authenticated subtree nulled this value.',
    )
  }
  return authContext
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
