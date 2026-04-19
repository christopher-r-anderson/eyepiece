import { describe, expect, it, vi } from 'vitest'
import { createSentryUserContextSync, toSentryUser } from './auth.sentry'

describe('createSentryUserContextSync', () => {
  it('applies bootstrap user state before any auth event', () => {
    const setUserContext = vi.fn()
    const sync = createSentryUserContextSync(setUserContext)

    sync.applyBootstrapUser({ id: 'bootstrap-user' })

    expect(setUserContext).toHaveBeenCalledWith({ id: 'bootstrap-user' })
  })

  it('ignores stale bootstrap state after an auth event has been seen', () => {
    const setUserContext = vi.fn()
    const sync = createSentryUserContextSync(setUserContext)

    sync.applyAuthEventUser({ id: 'new-user' })
    sync.applyBootstrapUser({ id: 'old-user' })

    expect(setUserContext).toHaveBeenCalledTimes(1)
    expect(setUserContext).toHaveBeenCalledWith({ id: 'new-user' })
  })
})

describe('toSentryUser', () => {
  it('returns null for missing users', () => {
    expect(toSentryUser(null)).toBeNull()
    expect(toSentryUser(undefined)).toBeNull()
  })

  it('only forwards the user id to Sentry', () => {
    expect(
      toSentryUser({
        id: 'user-123',
        email: 'user@example.com',
      }),
    ).toEqual({
      id: 'user-123',
    })
  })
})
