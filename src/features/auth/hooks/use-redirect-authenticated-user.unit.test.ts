import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHydrated, useNavigate } from '@tanstack/react-router'
import { useRedirectAuthenticatedUser } from './use-redirect-authenticated-user'
import { useCurrentUserQuery } from '@/features/auth/auth.queries'

vi.mock('@tanstack/react-router')
vi.mock('@/features/auth/auth.queries')
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

  it('keeps checking until hydration completes', () => {
    vi.mocked(useHydrated).mockReturnValue(false)

    const { result } = renderHook(() => useRedirectAuthenticatedUser('/next'))

    expect(result.current).toEqual({
      isChecking: true,
      shouldShowAuthForm: false,
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('shows the auth form when hydration and anonymous auth state are ready', () => {
    const { result } = renderHook(() => useRedirectAuthenticatedUser('/next'))

    expect(result.current).toEqual({
      isChecking: false,
      shouldShowAuthForm: true,
    })
  })

  it('does not redirect while auth state is still fetching', () => {
    vi.mocked(useCurrentUserQuery).mockReturnValue({
      data: { id: 'user-id' },
      isSuccess: true,
      isFetching: true,
    } as any)

    const { result } = renderHook(() => useRedirectAuthenticatedUser('/next'))

    expect(result.current).toEqual({
      isChecking: true,
      shouldShowAuthForm: false,
    })
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
