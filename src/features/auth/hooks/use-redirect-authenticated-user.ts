import { useEffect } from 'react'
import { useHydrated, useNavigate } from '@tanstack/react-router'
import { useCurrentUserQuery } from '../auth.queries'
import { urlToNextParam } from '@/lib/utils'

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

  return {
    isChecking: !isHydrated || !isSuccess || isFetching,
    shouldShowAuthForm: isHydrated && isSuccess && !isFetching && !user,
  }
}
