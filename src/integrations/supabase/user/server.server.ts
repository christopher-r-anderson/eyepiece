// NOTE: See https://github.com/supabase/supabase/issues/41123#issuecomment-3692773391
import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createServerOnlyFn } from '@tanstack/react-start'
import type { CookieMethodsServer, CookieOptions } from '@supabase/ssr'
import type { Database } from '../database.types'
import { markSessionRead } from '@/server/lib/session-read-sentinel'

export const createUserSupabaseServerClient = createServerOnlyFn(() => {
  // Session-read tripwire: this factory is the single server-side path to the
  // user's auth cookies, so creating a client here marks the request as
  // session-dependent and therefore not publicly cacheable.
  markSessionRead('createUserSupabaseServerClient')
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
