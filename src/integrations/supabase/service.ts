import { createClient } from '@supabase/supabase-js'
import { createServerOnlyFn } from '@tanstack/react-start'
import type { Database } from './database.types'

export const createServiceSupabaseClient = createServerOnlyFn(() => {
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    throw new Error('Missing Supabase Environment Variables')
  }

  return createClient<Database>(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
})
