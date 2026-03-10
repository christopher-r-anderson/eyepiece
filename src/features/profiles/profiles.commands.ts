import { useMemo } from 'react'
import {
  errorFromPostgrestError,
  profileInputToUpsertProfile,
  profileRowToProfileDisplay,
} from './profiles.utils'
import type { ProfileErrorCode } from './profiles.utils'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { Result } from '@/lib/result'
import type { Profile } from '@/domain/profile/profile.schema'
import { Err, Ok } from '@/lib/result'
import { useUserSupabaseClient } from '@/integrations/supabase/providers/user-provider'

export interface ProfilesCommands {
  upsertProfile: (
    profile: Profile,
  ) => Promise<Result<Profile, ProfileErrorCode>>
}

export function makeProfilesCommands(client: SupabaseClient): ProfilesCommands {
  return {
    upsertProfile: async (
      profile: Profile,
    ): Promise<Result<Profile, ProfileErrorCode>> => {
      const upsert = profileInputToUpsertProfile(profile)
      const { data, error } = await client
        .from('profiles')
        .upsert(upsert)
        .select('id, display_name')
        .limit(1)
        .single()
      if (error) {
        return Err(errorFromPostgrestError(error))
      }
      return Ok(profileRowToProfileDisplay(data))
    },
  }
}

export function useProfilesCommands(): ProfilesCommands {
  const client = useUserSupabaseClient()
  return useMemo(() => makeProfilesCommands(client), [client])
}
