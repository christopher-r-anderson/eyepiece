import { createIsomorphicFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from './server'
import { createSupabaseBrowserClient } from './browser'

export const createSupabaseClient = createIsomorphicFn()
  .server(() => createSupabaseServerClient())
  .client(() => createSupabaseBrowserClient())
