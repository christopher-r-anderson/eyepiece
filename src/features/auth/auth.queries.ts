import { queryOptions, useQuery } from '@tanstack/react-query'
import { getUser } from './get-user'
import type { QueryClient } from '@tanstack/react-query'
import type { User, UserCacheKey } from './auth.types'

export function getCurrentUserQueryOptions() {
  return queryOptions({
    queryKey: ['auth', 'user'] as UserCacheKey,
    queryFn: async (): Promise<User | null> => getUser(),
    staleTime: Infinity,
  })
}

export function useCurrentUserQuery() {
  return useQuery(getCurrentUserQueryOptions())
}

export function fetchCurrentUser({
  queryClient,
}: {
  queryClient: QueryClient
}) {
  return queryClient.fetchQuery(getCurrentUserQueryOptions())
}
