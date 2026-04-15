import { createServerFn } from '@tanstack/react-start'
import { createUserSupabaseServerClient } from '@/integrations/supabase/user/server.server'

export const hasServerClaims = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { data, error } =
    await createUserSupabaseServerClient().auth.getClaims()
  return !error && !!data
})
