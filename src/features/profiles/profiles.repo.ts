import {
  INVALID_INPUT_ERROR,
  errorFromPostgrestError,
  profileRowToProfileDisplay,
} from './profiles.utils'
import type { ProfileErrorCode } from './profiles.utils'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { ProfileDisplay } from '@/lib/schemas/profile.schema'
import type { Result } from '../../lib/result'
import { Err, Ok } from '@/lib/result'

export interface ProfilesRepo {
  getProfile: (
    id: string,
  ) => Promise<Result<ProfileDisplay | null, ProfileErrorCode>>
}

export function makeProfilesRepo(client: SupabaseClient): ProfilesRepo {
  return {
    getProfile: async (
      id: string,
    ): Promise<Result<ProfileDisplay | null, ProfileErrorCode>> => {
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
