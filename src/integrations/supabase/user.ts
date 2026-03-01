import { createIsomorphicFn } from '@tanstack/react-start'
import { createUserSupabaseServerClient } from './user/server'
import { createUserSupabaseBrowserClient } from './user/browser'

export const createUserSupabaseClient = createIsomorphicFn()
  .server(() => createUserSupabaseServerClient())
  .client(() => createUserSupabaseBrowserClient())

export const getUser = createIsomorphicFn()
  .server(async () => {
    const { data } = await createUserSupabaseServerClient().auth.getUser()
    return data.user
  })
  .client(async () => {
    const { data } = await createUserSupabaseBrowserClient().auth.getSession()
    return data.session?.user
  })
