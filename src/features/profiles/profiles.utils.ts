import { z } from 'zod'
import type { PostgrestError } from '@supabase/supabase-js'
import type { ZodError } from 'zod'
import type { ResultError } from '@/lib/result'
import type { Database } from '@/integrations/supabase/database.types'
import type { ProfileDisplay, ProfileInput } from '@/lib/schemas/profile.schema'

export const NOT_FOUND_ERROR = 'not_found' as const
export const INVALID_INPUT_ERROR = 'invalid_input' as const
export const UNKNOWN_ERROR = 'unknown_error' as const

export type ProfileErrorCode =
  | typeof NOT_FOUND_ERROR
  | typeof INVALID_INPUT_ERROR
  | typeof UNKNOWN_ERROR

export function errorFromZodError<T>(
  zodError: ZodError<T>,
): ResultError<ProfileErrorCode> {
  const flattenedErrors = z.flattenError(zodError)
  const error = {
    code: INVALID_INPUT_ERROR,
    message: flattenedErrors.formErrors[0] || 'Invalid input',
    fieldErrors: {} as Record<string, string>,
  }
  Object.entries(flattenedErrors.fieldErrors).forEach(([key, value]) => {
    if (
      value &&
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === 'string'
    ) {
      error.fieldErrors[key] = value[0]
    }
  })
  return error
}

const validationMap: Record<string, Record<string, string> | undefined> = {
  profile_display_name_nonempty_check: {
    displayName: 'Display name must not be empty.',
  },
  profile_display_name_length_check: {
    displayName: 'Display name is too long.',
  },
}

function mapValidationError(message: string) {
  const match = validationMap[message]
  if (match) {
    return { ...match }
  }
}

export function errorFromPostgrestError(
  pgError: PostgrestError,
): ResultError<ProfileErrorCode> {
  const validationError = mapValidationError(pgError.message)
  if (validationError) {
    return {
      message: 'Invalid input',
      code: INVALID_INPUT_ERROR,
      fieldErrors: validationError,
    }
  }
  return {
    code: UNKNOWN_ERROR,
    message: 'There was an error processing your request.',
  }
}
type InsertProfile = Database['public']['Tables']['profiles']['Insert']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

export function profileInputToUpsertProfile(
  input: ProfileInput,
): InsertProfile {
  return {
    id: input.id,
    display_name: input.displayName,
  }
}

export function profileRowToProfileDisplay(
  row: Pick<ProfileRow, 'id' | 'display_name'>,
): ProfileDisplay {
  return {
    id: row.id,
    displayName: row.display_name,
  }
}
