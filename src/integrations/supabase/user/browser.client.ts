import { createBrowserClient } from '@supabase/ssr'
import { createClientOnlyFn } from '@tanstack/react-start'
import type { Database } from '../database.types'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export const createUserSupabaseBrowserClient = createClientOnlyFn(() => {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    )
  }
  return browserClient
})
