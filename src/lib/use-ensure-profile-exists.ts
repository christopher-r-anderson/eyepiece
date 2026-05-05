import { useEffect } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { urlToNextParam } from './utils'
import { logErrorWithObservability } from './error-logging'
import { useCurrentUserQuery } from '@/features/auth/auth.queries'
import { fetchProfile } from '@/features/profiles/profiles.queries'
import { usePublicSupabaseClient } from '@/integrations/supabase/providers/public-provider'

/**
 * Client-side hook that redirects authenticated users without a profile to `/complete-profile`.
 *
 * This hook replaces the server-side `userHasProfile` beforeLoad guard on public pages.
 * Running this check client-side (after hydration) preserves SSR cache safety: public page
 * responses never branch on user identity during render, so they remain CDN-cacheable.
 *
 * **Dependency**: This hook relies on `AuthStateSync` having already seeded the user query cache
 * (mounted in AppProviders before route rendering). By the time this hook runs post-hydration,
 * `useCurrentUserQuery` will read the cached user without a new fetch.
 *
 * Behavior:
 * - If on `/complete-profile` path: no-op (prevent infinite redirect)
 * - If unauthenticated: no-op (allow anonymous browsing)
 * - If authenticated with profile: no-op (allow access)
 * - If authenticated without profile: redirect to `/complete-profile?next=...`
 * - If profile fetch fails: silently no-op, log error to observability (don't degrade public content)
 */
export function useEnsureProfileExists(): void {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const publicSupabaseClient = usePublicSupabaseClient()

  const { data: user } = useCurrentUserQuery()

  useEffect(() => {
    // Guard against infinite redirect: if already on completion page, don't check/redirect
    if (location.pathname === '/complete-profile') {
      return
    }

    // If no user (unauthenticated), allow through
    if (!user) {
      return
    }

    // Check if profile exists; redirect if missing
    ;(async () => {
      try {
        const profile = await fetchProfile({
          id: user.id,
          queryClient,
          publicSupabaseClient,
        })

        // If profile exists, allow through
        if (profile) {
          return
        }
      } catch (error) {
        // Silently allow public content to render on profile fetch failure.
        // Profile completion is a courtesy, not a blocker. Log error for observability.
        logErrorWithObservability(
          'Profile fetch failed in useEnsureProfileExists',
          error,
          {
            userId: user.id,
            path: location.pathname,
          },
        )
        return
      }

      // Redirect to profile completion with next param to resume after
      // Moved outside try/catch: navigation errors should not be mislabeled as profile fetch failures
      await navigate({
        to: '/complete-profile',
        search: { next: urlToNextParam(location.href) },
      })
    })()
  }, [
    user,
    location.pathname,
    location.href,
    navigate,
    queryClient,
    publicSupabaseClient,
  ])
}
