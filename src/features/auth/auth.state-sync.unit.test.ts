import { render } from '@testing-library/react'
import { Fragment, createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthStateSync } from './auth.state-sync'
import { useAuthCommands } from './hooks/use-auth-commands'

const mockSetQueryData = vi.fn()
const mockRemoveQueries = vi.fn()
const mockInvalidate = vi.fn()
const mockGetSession = vi.fn()
const mockOnUserChange = vi.fn()
const mockUnsubscribe = vi.fn()
const mockApplyAuthEventUser = vi.fn()
const mockApplyBootstrapUser = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    setQueryData: mockSetQueryData,
    removeQueries: mockRemoveQueries,
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    invalidate: mockInvalidate,
  }),
}))

vi.mock('@/integrations/supabase/user', () => ({
  createUserSupabaseClient: () => ({
    auth: {
      getSession: mockGetSession,
    },
  }),
}))

vi.mock('./auth.events', () => ({
  onUserChange: (...args: Array<unknown>) => mockOnUserChange(...args),
}))

vi.mock('./auth.sentry', () => ({
  setSentryUserContext: vi.fn(),
  createSentryUserContextSync: () => ({
    applyAuthEventUser: mockApplyAuthEventUser,
    applyBootstrapUser: mockApplyBootstrapUser,
  }),
}))

describe('AuthStateSync', () => {
  beforeEach(() => {
    mockSetQueryData.mockReset()
    mockRemoveQueries.mockReset()
    mockInvalidate.mockReset()
    mockGetSession.mockReset()
    mockOnUserChange.mockReset()
    mockUnsubscribe.mockReset()
    mockApplyAuthEventUser.mockReset()
    mockApplyBootstrapUser.mockReset()

    mockOnUserChange.mockReturnValue(mockUnsubscribe)
    mockGetSession.mockResolvedValue({ data: { session: null } })
  })

  it('registers exactly one auth-state subscription per mount', () => {
    render(createElement(AuthStateSync))

    expect(mockOnUserChange).toHaveBeenCalledTimes(1)
  })

  it('unsubscribes exactly once on unmount', () => {
    const view = render(createElement(AuthStateSync))

    view.unmount()

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('registers exactly one subscription even with auth-command consumers in the tree', () => {
    function AuthCommandsConsumer() {
      useAuthCommands()
      return null
    }

    render(
      createElement(
        Fragment,
        null,
        createElement(AuthStateSync),
        createElement(AuthCommandsConsumer),
        createElement(AuthCommandsConsumer),
      ),
    )

    expect(mockOnUserChange).toHaveBeenCalledTimes(1)
  })
})
