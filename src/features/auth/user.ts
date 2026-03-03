import { createIsomorphicFn } from '@tanstack/react-start'
import type { User } from '@/features/auth/types'
import { createUserSupabaseBrowserClient } from '@/integrations/supabase/user/browser.client'
import { createUserSupabaseServerClient } from '@/integrations/supabase/user/server.server'

export const getUser = createIsomorphicFn()
  .server(async (): Promise<User | null> => {
    const { data } = await createUserSupabaseServerClient().auth.getUser()
    return data.user
  })
  .client(async (): Promise<User | null> => {
    const { data } = await createUserSupabaseBrowserClient().auth.getSession()
    return data.session?.user ?? null
  })
