// NOTE: See https://github.com/supabase/supabase/issues/41123#issuecomment-3692773391
import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createServerOnlyFn } from '@tanstack/react-start'
import type { CookieMethodsServer, CookieOptions } from '@supabase/ssr'
import type { Database } from '../database.types'

export const createUserSupabaseServerClient = createServerOnlyFn(() => {
  if (
    !process.env.VITE_SUPABASE_URL ||
    !process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ) {
    throw new Error('Missing Supabase Environment Variables')
  }
  const cookies: CookieMethodsServer = {
    getAll() {
      return Object.entries(getCookies()).map(([name, value]) => ({
        name,
        value,
      }))
    },
    setAll(
      cookiesToSet: Array<{
        name: string
        value: string
        options: CookieOptions
      }>,
    ) {
      cookiesToSet.forEach(({ name, value, options }) => {
        setCookie(name, value, options)
      })
    },
  }
  return createServerClient<Database>(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      cookies,
    },
  )
})
