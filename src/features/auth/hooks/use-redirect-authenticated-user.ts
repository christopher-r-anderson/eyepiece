import { useEffect } from 'react'
import { useHydrated, useNavigate } from '@tanstack/react-router'
import { useCurrentUserQuery } from '../auth.queries'
import { urlToNextParam } from '@/lib/utils'

// The auth pages SSR their forms so pre-hydration submits work; a
// logged-in visitor gets this client-side redirect once their session is
// known instead of a server-side gate (which would cost the pages their
// public cacheability)
export function useRedirectAuthenticatedUser(next?: string) {
  const isHydrated = useHydrated()
  const navigate = useNavigate()
  const { data: user, isSuccess, isFetching } = useCurrentUserQuery()

  useEffect(() => {
    if (!isHydrated || !isSuccess || isFetching || !user) {
      return
    }

    void navigate({
      to: next ? urlToNextParam(next) : '/',
      replace: true,
    })
  }, [isHydrated, isSuccess, isFetching, user, next, navigate])
}
