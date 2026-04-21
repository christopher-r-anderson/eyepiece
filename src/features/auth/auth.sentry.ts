import * as Sentry from '@sentry/tanstackstart-react'
import type { User } from './auth.types'

export function createSentryUserContextSync(
  setUserContext: (user: User | null | undefined) => void,
) {
  let hasSeenAuthEvent = false

  return {
    applyBootstrapUser(user: User | null | undefined) {
      if (hasSeenAuthEvent) {
        return
      }

      setUserContext(user)
    },
    applyAuthEventUser(user: User | null | undefined) {
      hasSeenAuthEvent = true
      setUserContext(user)
    },
  }
}

export function toSentryUser(user: User | null | undefined) {
  if (!user) {
    return null
  }

  return {
    id: user.id,
  }
}

export function setSentryUserIdContext(userId: string | null | undefined) {
  Sentry.setUser(userId ? { id: userId } : null)
}

export function setSentryUserContext(user: User | null | undefined) {
  setSentryUserIdContext(toSentryUser(user)?.id)
}
