import type { AuthChangeEvent } from '@supabase/supabase-js'
import type { User } from './auth.types'
import { createUserSupabaseBrowserClient } from '@/integrations/supabase/user/browser.client'

const LISTEN_EVENTS: Array<AuthChangeEvent> = [
  'SIGNED_IN',
  'SIGNED_OUT',
  'USER_UPDATED',
] as const

// NOTE: this is safe because it is browser side only.
let lastUserId: string | undefined = undefined
let lastUserEmail: string | undefined = undefined

export function onUserChange(callback: (user: User | null) => void) {
  const supabase = createUserSupabaseBrowserClient()
  const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
    const { id, email } = session?.user ?? {}
    if (
      LISTEN_EVENTS.includes(event) &&
      (lastUserId !== id || lastUserEmail !== email)
    ) {
      lastUserId = id
      lastUserEmail = email
      if (id) {
        callback({ id, email })
      } else {
        callback(null)
      }
    }
  })
  return () => sub.subscription.unsubscribe()
}
