import {
  errorFromPostgrestError,
  profileInputToUpsertProfile,
  profileRowToProfileDisplay,
} from './profiles.utils'
import type { ProfileErrorCode } from './profiles.utils'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { Result } from '@/lib/result'
import type { ProfileDisplay, ProfileInput } from '@/lib/schemas/profile.schema'
import { Err, Ok } from '@/lib/result'

export interface ProfilesCommands {
  upsertProfile: (
    profile: ProfileInput,
  ) => Promise<Result<ProfileDisplay, ProfileErrorCode>>
}

export function makeProfilesCommands(client: SupabaseClient): ProfilesCommands {
  return {
    upsertProfile: async (
      profile: ProfileInput,
    ): Promise<Result<ProfileDisplay, ProfileErrorCode>> => {
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
