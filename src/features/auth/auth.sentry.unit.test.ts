import { describe, expect, it, vi } from 'vitest'
import * as Sentry from '@sentry/tanstackstart-react'
import {
  createSentryUserContextSync,
  setSentryUserContext,
  setSentryUserIdContext,
  toSentryUser,
} from './auth.sentry'

vi.mock('@sentry/tanstackstart-react', () => ({
  setUser: vi.fn(),
}))

const mockSetUser = vi.mocked(Sentry.setUser)

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

describe('setSentryUserIdContext', () => {
  it('sets only the user id on the Sentry scope', () => {
    setSentryUserIdContext('user-123')

    expect(mockSetUser).toHaveBeenCalledWith({ id: 'user-123' })
  })

  it('clears the Sentry user when the id is missing', () => {
    setSentryUserIdContext(null)

    expect(mockSetUser).toHaveBeenCalledWith(null)
  })
})

describe('setSentryUserContext', () => {
  it('forwards only the id from the user object', () => {
    setSentryUserContext({ id: 'user-123', email: 'user@example.com' })

    expect(mockSetUser).toHaveBeenCalledWith({ id: 'user-123' })
  })
})
