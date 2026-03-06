import { queryOptions, useQuery } from '@tanstack/react-query'
import { getUser } from './get-user'
import type { User, UserCacheKey } from './auth.types'

export function getUserQueryOptions() {
  return queryOptions({
    queryKey: ['auth', 'user'] as UserCacheKey,
    queryFn: async (): Promise<User | null> => getUser(),
    staleTime: Infinity,
  })
}

export function useUserQuery() {
  return useQuery(getUserQueryOptions())
}
