import { createIsomorphicFn } from '@tanstack/react-start'
import type { User } from './auth.types'
import { createUserSupabaseBrowserClient } from '@/integrations/supabase/user/browser.client'
import { createUserSupabaseServerClient } from '@/integrations/supabase/user/server.server'

// getting the user from the session on the client avoids a roundtrip, but is insecure on the server
// see: https://supabase.com/docs/reference/javascript/auth-getuser
export const getUser = createIsomorphicFn()
  .server(async (): Promise<User | null> => {
    const { data } = await createUserSupabaseServerClient().auth.getUser()
    return data.user
  })
  .client(async (): Promise<User | null> => {
    const { data } = await createUserSupabaseBrowserClient().auth.getSession()
    return data.session?.user ?? null
  })
