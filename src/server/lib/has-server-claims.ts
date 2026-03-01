import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '@/integrations/supabase/server'

export const hasServerClaims = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { data, error } = await createSupabaseServerClient().auth.getClaims()
  return !error && !!data
})
