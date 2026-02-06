import type { Database } from '@/lib/supabase/database.types'
import type { ProfileDisplay, ProfileInput } from '@/lib/schemas/profile.schema'

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
