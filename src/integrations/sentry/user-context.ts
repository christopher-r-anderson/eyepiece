import * as Sentry from '@sentry/tanstackstart-react'

export function setSentryUserIdContext(userId: string | null | undefined) {
  Sentry.setUser(userId ? { id: userId } : null)
}
