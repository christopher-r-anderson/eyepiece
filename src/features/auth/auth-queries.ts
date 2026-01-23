import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getUser, onUserChange } from './auth-service'
import type { User } from './types'

type UserCacheKey = ['auth', 'user']

export function useUserQuery() {
  return useQuery({
    queryKey: ['auth', 'user'] as UserCacheKey,
    queryFn: async (): Promise<User | null> => getUser(),
    staleTime: Infinity,
  })
}

export function useAuthSubscription() {
  const queryClient = useQueryClient()

  useEffect(() => {
    return onUserChange((user) => {
      queryClient.setQueryData(['auth', 'user'] as UserCacheKey, user)

      // invalidate user-scoped queries on login/logout
      // queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'me' })
    })
  }, [queryClient])
}
