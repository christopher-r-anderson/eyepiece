import { useEffect } from 'react'
import {
  queryOptions,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { makeProfilesRepo, useProfilesRepo } from './profiles.repo'
import type { QueryClient } from '@tanstack/react-query'
import type { ProfilesRepo } from './profiles.repo'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { Profile } from '@/domain/profile/profile.schema'
import { meKey } from '@/lib/query-keys'
import { resultIsSuccess, unwrapOrThrow } from '@/lib/result'

const profilesKeys = {
  all: ['profiles'] as const,
  profile: (id: Profile['id']) => [...profilesKeys.all, 'detail', id] as const,
}

const currentUserProfileKeys = {
  all: [...meKey, 'profile'] as const,
  ensure: (userId: string | null) =>
    [...currentUserProfileKeys.all, 'ensure', userId] as const,
}

export function getProfileOptions({
  repo,
  id,
}: {
  repo: Pick<ProfilesRepo, 'getProfile'>
  id: string
}) {
  return queryOptions({
    queryKey: profilesKeys.profile(id),
    queryFn: async () => {
      const result = await repo.getProfile(id)
      return unwrapOrThrow(result)
    },
    staleTime: 60 * 60 * 1000,
  })
}

export function getEnsureProfileByIdOptions({
  userId,
  repo,
  enabled,
}: {
  userId: string | null
  repo: Pick<ProfilesRepo, 'getProfile'>
  enabled?: boolean
}) {
  return queryOptions({
    queryKey: currentUserProfileKeys.ensure(userId),
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) {
        return null
      }

      const profileResult = await repo.getProfile(userId)
      if (!resultIsSuccess(profileResult)) {
        throw profileResult.error
      }

      return profileResult.data
    },
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false,
    enabled,
  })
}

// Write-through after a successful profile upsert. Keeping the ensure cache
// in sync matters for cache safety UX: useEnsureProfileExists redirects on a
// null ensure result, so a stale null here could bounce a user who just
// completed their profile back to /complete-profile.
export function setProfileQueryData(
  queryClient: QueryClient,
  profile: Profile,
) {
  queryClient.setQueryData(profilesKeys.profile(profile.id), profile)
  queryClient.setQueryData(currentUserProfileKeys.ensure(profile.id), profile)
}

export function useEnsureProfile({
  userId,
  enabled,
}: {
  userId: string | null
  enabled?: boolean
}) {
  const repo = useProfilesRepo()
  const queryClient = useQueryClient()
  const query = useQuery(getEnsureProfileByIdOptions({ userId, repo, enabled }))

  useEffect(() => {
    if (!userId || !query.isSuccess) {
      return
    }

    if (query.data) {
      queryClient.setQueryData(profilesKeys.profile(userId), query.data)
      return
    }

    queryClient.removeQueries({
      queryKey: profilesKeys.profile(userId),
      exact: true,
    })
  }, [queryClient, userId, query.isSuccess, query.data])

  return query
}

export function useSuspenseProfile(profileId: Profile['id']) {
  const repo = useProfilesRepo()
  const { data: profile } = useSuspenseQuery(
    getProfileOptions({ repo, id: profileId }),
  )
  return profile
}

export async function ensureProfile({
  id,
  queryClient,
  publicSupabaseClient,
}: {
  id: Profile['id']
  queryClient: QueryClient
  publicSupabaseClient: SupabaseClient
}): Promise<Profile | null> {
  const repo = makeProfilesRepo(publicSupabaseClient)
  return queryClient.ensureQueryData(getProfileOptions({ repo, id }))
}

export function fetchProfile({
  id,
  queryClient,
  publicSupabaseClient,
}: {
  id: Profile['id']
  queryClient: QueryClient
  publicSupabaseClient: SupabaseClient
}) {
  const repo = makeProfilesRepo(publicSupabaseClient)
  return queryClient.fetchQuery(getProfileOptions({ repo, id }))
}
