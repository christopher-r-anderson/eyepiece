import { createIsomorphicFn } from '@tanstack/react-start'
import { createUserSupabaseServerClient } from './user/server.server'
import { createUserSupabaseBrowserClient } from './user/browser.client'

export const createUserSupabaseClient = createIsomorphicFn()
  .server(() => createUserSupabaseServerClient())
  .client(() => createUserSupabaseBrowserClient())
