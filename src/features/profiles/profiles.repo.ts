import { useMemo } from 'react'
import {
  INVALID_INPUT_ERROR,
  errorFromPostgrestError,
  profileRowToProfileDisplay,
} from './profiles.utils'
import type { ProfileErrorCode } from './profiles.utils'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { Profile } from '@/domain/profile/profile.schema'
import type { Result } from '@/lib/result'
import { Err, Ok } from '@/lib/result'
import { usePublicSupabaseClient } from '@/integrations/supabase/providers/public-provider'

export interface ProfilesRepo {
  getProfile: (id: string) => Promise<Result<Profile | null, ProfileErrorCode>>
}

export function makeProfilesRepo(client: SupabaseClient): ProfilesRepo {
  return {
    getProfile: async (
      id: string,
    ): Promise<Result<Profile | null, ProfileErrorCode>> => {
      if (typeof id !== 'string' || id.length === 0) {
        return Err({ message: 'Invalid profile ID', code: INVALID_INPUT_ERROR })
      }
      const { data, error } = await client
        .from('profiles')
        .select('id, display_name')
        .eq('id', id)
        .maybeSingle()
      if (error) {
        return Err(errorFromPostgrestError(error))
      }
      return Ok(data ? profileRowToProfileDisplay(data) : null)
    },
  }
}

export function useProfilesRepo(): ProfilesRepo {
  const client = usePublicSupabaseClient()
  return useMemo(() => makeProfilesRepo(client), [client])
}
