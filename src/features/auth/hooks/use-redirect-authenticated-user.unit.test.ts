import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHydrated, useNavigate } from '@tanstack/react-router'
import { useCurrentUserQuery } from '../auth.queries'
import { useRedirectAuthenticatedUser } from './use-redirect-authenticated-user'

vi.mock('@tanstack/react-router')
vi.mock('../auth.queries')
vi.mock('@/lib/utils', () => ({
  urlToNextParam: vi.fn((url) => `/clean${url}`),
}))

describe('useRedirectAuthenticatedUser', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useHydrated).mockReturnValue(true)
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(useCurrentUserQuery).mockReturnValue({
      data: null,
      isSuccess: true,
      isFetching: false,
    } as any)
  })

  it('does not redirect before hydration completes', () => {
    vi.mocked(useHydrated).mockReturnValue(false)

    renderHook(() => useRedirectAuthenticatedUser('/next'))

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('does not redirect anonymous visitors', () => {
    renderHook(() => useRedirectAuthenticatedUser('/next'))

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('does not redirect while auth state is still fetching', () => {
    vi.mocked(useCurrentUserQuery).mockReturnValue({
      data: { id: 'user-id' },
      isSuccess: true,
      isFetching: true,
    } as any)

    renderHook(() => useRedirectAuthenticatedUser('/next'))

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('redirects authenticated users to the sanitized next param', async () => {
    vi.mocked(useCurrentUserQuery).mockReturnValue({
      data: { id: 'user-id' },
      isSuccess: true,
      isFetching: false,
    } as any)

    renderHook(() => useRedirectAuthenticatedUser('/favorites?auth=login'))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/clean/favorites?auth=login',
        replace: true,
      })
    })
  })

  it('redirects authenticated users home when next is absent', async () => {
    vi.mocked(useCurrentUserQuery).mockReturnValue({
      data: { id: 'user-id' },
      isSuccess: true,
      isFetching: false,
    } as any)

    renderHook(() => useRedirectAuthenticatedUser())

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/',
        replace: true,
      })
    })
  })
})
