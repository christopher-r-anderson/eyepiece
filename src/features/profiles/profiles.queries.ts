import { queryOptions } from '@tanstack/react-query'
import type { ProfilesRepo } from './profiles.repo'
import { unwrapOrThrow } from '@/lib/result'

type ProfileKey = ['profile', string]

function profileKey(profileId: string): ProfileKey {
  return ['profile', profileId] as const
}

export function getProfileOptions({
  repo,
  id,
}: {
  repo: Pick<ProfilesRepo, 'getProfile'>
  id: string
}) {
  return queryOptions({
    queryKey: profileKey(id),
    queryFn: async () => {
      const result = await repo.getProfile(id)
      return unwrapOrThrow(result)
    },
    staleTime: 60 * 60 * 1000,
  })
}
