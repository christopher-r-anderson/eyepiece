import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { makeProfilesRepo, useProfilesRepo } from './profiles.repo'
import type { QueryClient } from '@tanstack/react-query'
import type { ProfilesRepo } from './profiles.repo'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { Profile } from '@/domain/profile/profile.schema'
import { unwrapOrThrow } from '@/lib/result'

const profilesKeys = {
  all: ['profiles'] as const,
  profile: (id: Profile['id']) => [...profilesKeys.all, 'detail', id] as const,
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
