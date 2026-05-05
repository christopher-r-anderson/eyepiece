import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useRouter } from '@tanstack/react-router'
import { onUserChange } from './auth.events'
import { authKeys } from './auth.queries'
import {
  createSentryUserContextSync,
  setSentryUserContext,
} from './auth.sentry'
import { meKey } from '@/lib/query-keys'
import { createUserSupabaseClient } from '@/integrations/supabase/user'

function useAuthStateSync() {
  const queryClient = useQueryClient()
  const router = useRouter()
  // Creates its own client directly so AuthStateSync is self-sufficient and can be
  // mounted at any level without requiring UserSupabaseClientProvider in the tree.
  // Auth state subscription only runs in the browser (inside useEffect).
  const supabaseClient = useMemo(() => createUserSupabaseClient(), [])

  useEffect(() => {
    let isMounted = true
    const sentryUserContextSync =
      createSentryUserContextSync(setSentryUserContext)

    const unsubscribe = onUserChange(supabaseClient, (user) => {
      sentryUserContextSync.applyAuthEventUser(user)
      queryClient.setQueryData(authKeys.user(), user)
      queryClient.removeQueries({
        queryKey: meKey,
      })
      router.invalidate()
    })

    void supabaseClient.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return
      }

      sentryUserContextSync.applyBootstrapUser(data.session?.user ?? null)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [queryClient, supabaseClient, router])
}

export function AuthStateSync() {
  useAuthStateSync()
  return null
}
