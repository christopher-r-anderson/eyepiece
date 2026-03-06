import type { AuthChangeEvent } from '@supabase/supabase-js'
import type { User } from './auth.types'

export type AuthChangeSession = {
  user?: {
    id?: string
    email?: string | null
  } | null
} | null

export type OnAuthStateChange = (
  callback: (event: AuthChangeEvent, session: AuthChangeSession) => void,
) => {
  data: {
    subscription: {
      unsubscribe: () => void
    }
  }
}

export type AuthClient = {
  auth: {
    onAuthStateChange: OnAuthStateChange
  }
}

const LISTEN_EVENTS: Array<AuthChangeEvent> = [
  'SIGNED_IN',
  'SIGNED_OUT',
  'USER_UPDATED',
] as const

export function onUserChange(
  client: AuthClient,
  callback: (user: User | null) => void,
) {
  let lastUserId: string | undefined = undefined
  let lastUserEmail: string | null | undefined = undefined
  const { data: sub } = client.auth.onAuthStateChange((event, session) => {
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
