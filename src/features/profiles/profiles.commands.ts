import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  errorFromPostgrestError,
  profileInputToUpsertProfile,
  profileRowToProfileDisplay,
} from './profiles.utils'
import { setProfileQueryData } from './profiles.queries'
import type { ProfileErrorCode } from './profiles.utils'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { Result } from '@/lib/result'
import type { Profile } from '@/domain/profile/profile.schema'
import { Err, Ok, resultIsSuccess } from '@/lib/result'
import { useUserSupabaseClient } from '@/integrations/supabase/user.hooks'

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
  const queryClient = useQueryClient()
  return useMemo(() => {
    const commands = makeProfilesCommands(client)
    return {
      upsertProfile: async (profile) => {
        const result = await commands.upsertProfile(profile)
        if (resultIsSuccess(result)) {
          setProfileQueryData(queryClient, result.data)
        }
        return result
      },
    }
  }, [client, queryClient])
}
