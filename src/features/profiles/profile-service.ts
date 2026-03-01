import {
  profileInputToUpsertProfile,
  profileRowToProfileDisplay,
} from './data/profiles'
import {
  INVALID_INPUT_ERROR,
  NOT_FOUND_ERROR,
  errorFromPostgrestError,
  errorFromZodError,
} from './errors'
import type { ProfileErrorCode } from './errors'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { ProfileDisplay, ProfileInput } from '@/lib/schemas/profile.schema'
import type { Result } from '../../lib/result'
import { Err } from '@/lib/result'
import { profileInputSchema } from '@/lib/schemas/profile.schema'
import { createUserSupabaseClient } from '@/integrations/supabase/user'

export function upsertProfile(input: unknown) {
  return makeUpsertProfile(createUserSupabaseClient())(input)
}

export function makeUpsertProfile(client: SupabaseClient) {
  return async function doUpsertProfile(
    input: unknown,
  ): Promise<Result<ProfileDisplay, ProfileErrorCode>> {
    const result = profileInputSchema.safeParse(input)
    if (!result.success) {
      return Err(errorFromZodError(result.error))
    }
    const profile: ProfileInput = result.data
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
    return {
      kind: 'success',
      data: profileRowToProfileDisplay(data),
    }
  }
}

export function getProfile(id: string) {
  return makeGetProfile(createUserSupabaseClient())(id)
}

export function makeGetProfile(client: SupabaseClient) {
  return async function doGetProfile(
    id: string,
  ): Promise<Result<ProfileDisplay, ProfileErrorCode>> {
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
    } else if (!data) {
      return Err({ message: 'Profile not found', code: NOT_FOUND_ERROR })
    }
    return {
      kind: 'success',
      data: profileRowToProfileDisplay(data),
    }
  }
}
