import { useQuery } from '@tanstack/react-query'
import type { User, UserCacheKey } from './types'
import { getUser } from '@/features/auth/user'

export function useUserQuery() {
  return useQuery({
    queryKey: ['auth', 'user'] as UserCacheKey,
    queryFn: async (): Promise<User | null> => getUser(),
    staleTime: Infinity,
  })
}
