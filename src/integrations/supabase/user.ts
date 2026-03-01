import { createIsomorphicFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from './server'
import { createSupabaseBrowserClient } from './browser'

export const getUser = createIsomorphicFn()
  .server(async () => {
    const { data } = await createSupabaseServerClient().auth.getUser()
    return data.user
  })
  .client(async () => {
    const { data } = await createSupabaseBrowserClient().auth.getSession()
    return data.session?.user
  })
