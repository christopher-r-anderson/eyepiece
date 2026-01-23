import { z } from 'zod'

// This should match the supabase password policy that was set
// recommended minimum of 12 characters and no complexity requirements
// see `supabase/config.toml` `[auth]` section for settings
export const PASSWORD_MIN_LENGTH = 12

export const setPasswordFieldSchema = z.string().min(PASSWORD_MIN_LENGTH)
