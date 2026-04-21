import { queryOptions, useQuery } from '@tanstack/react-query'
import { getUser } from './get-user'
import { setSentryUserContext } from './auth.sentry'
import type { QueryClient } from '@tanstack/react-query'
import type { User } from './auth.types'

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
}

export function getCurrentUserQueryOptions() {
  return queryOptions({
    queryKey: authKeys.user(),
    queryFn: async (): Promise<User | null> => {
      const user = await getUser()
      setSentryUserContext(user)
      return user
    },
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
