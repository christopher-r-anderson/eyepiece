import { useMemo } from 'react'
import { createUserSupabaseClient } from './user'

// Resolves per environment: a per-request server client during SSR render,
// the shared browser singleton on the client. No React provider is needed;
// route-tree position must not change which client a component receives.
export function useUserSupabaseClient() {
  return useMemo(() => createUserSupabaseClient(), [])
}
