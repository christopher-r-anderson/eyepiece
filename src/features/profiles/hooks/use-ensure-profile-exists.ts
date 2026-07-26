import { useEffect } from 'react'
import { useHydrated, useLocation, useNavigate } from '@tanstack/react-router'
import { useEnsureProfile } from '../profiles.queries'
import { useCurrentUserQuery } from '@/features/auth/auth.queries'
import { logErrorWithObservability } from '@/lib/error-logging'
import { urlToNextParam } from '@/lib/utils'

/**
 * Client-side hook that redirects authenticated users without a profile to `/complete-profile`.
 *
 * This hook replaces the server-side `userHasProfile` beforeLoad guard on public pages.
 * Running this check client-side (after hydration) preserves SSR cache safety: public page
 * responses never branch on user identity during render, so they remain CDN-cacheable.
 */
export function useEnsureProfileExists(): void {
  const isHydrated = useHydrated()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: user } = useCurrentUserQuery()
  const userId = user?.id ?? null
  const shouldEnsureProfile =
    isHydrated && location.pathname !== '/complete-profile' && !!user

  const {
    data: ensuredProfile,
    isSuccess: isEnsureProfileSuccess,
    isFetching: isEnsureProfileFetching,
    isError: isEnsureProfileError,
    error: ensureProfileError,
  } = useEnsureProfile({ userId, enabled: shouldEnsureProfile })

  useEffect(() => {
    if (!shouldEnsureProfile || !isEnsureProfileError) {
      return
    }

    logErrorWithObservability(
      'Profile ensure failed in useEnsureProfileExists',
      ensureProfileError,
      {
        userId: userId ?? undefined,
        path: location.pathname,
      },
    )
  }, [
    shouldEnsureProfile,
    isEnsureProfileError,
    ensureProfileError,
    userId,
    location.pathname,
  ])

  useEffect(() => {
    if (
      !shouldEnsureProfile ||
      !isEnsureProfileSuccess ||
      isEnsureProfileFetching ||
      ensuredProfile
    ) {
      return
    }

    void navigate({
      to: '/complete-profile',
      search: { next: urlToNextParam(location.href) },
    })
  }, [
    shouldEnsureProfile,
    isEnsureProfileSuccess,
    isEnsureProfileFetching,
    ensuredProfile,
    location.pathname,
    location.href,
    navigate,
  ])
}
