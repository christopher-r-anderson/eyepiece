import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from './types'

export function createPublicSupabaseClient(): SupabaseClient {
  if (
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ) {
    throw new Error('Missing Supabase Environment Variables')
  }
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: {
          getItem: (_key: string) => null,
          setItem: (_key: string, _value: string) => {},
          removeItem: (_key: string) => {},
        },
      },
      global: {
        fetch: (input, init) => {
          const nextInit: RequestInit = { ...init, credentials: 'omit' }
          return fetch(input, nextInit)
        },
      },
    },
  )
}
