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
      auth: {
        // storage is disabled, but GoTrueClient warning will be triggered if there are multiple instances
        // and we create this and a user specific one
        storageKey: 'supabase-service-auth',
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
})
