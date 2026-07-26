import { describe, expect, it, vi } from 'vitest'
import * as Sentry from '@sentry/tanstackstart-react'
import { setSentryUserIdContext } from './user-context'

vi.mock('@sentry/tanstackstart-react', () => ({
  setUser: vi.fn(),
}))

const mockSetUser = vi.mocked(Sentry.setUser)

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
