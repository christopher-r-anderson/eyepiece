import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEnsureProfileExists } from './use-ensure-profile-exists'
import * as authQueries from '@/features/auth/auth.queries'
import * as profileQueries from '@/features/profiles/profiles.queries'
import * as errorLogging from '@/lib/error-logging'
import { usePublicSupabaseClient } from '@/integrations/supabase/providers/public-provider'

vi.mock('@/features/auth/auth.queries')
vi.mock('@/features/profiles/profiles.queries')
vi.mock('@/lib/error-logging')
vi.mock('@tanstack/react-router')
vi.mock('@tanstack/react-query')
vi.mock('@/integrations/supabase/providers/public-provider')
vi.mock('@/lib/utils', () => ({
  urlToNextParam: vi.fn((url) => `/mocked?next=${url}`),
}))

describe('useEnsureProfileExists', () => {
  const mockNavigate = vi.fn()
  const mockQueryClient = {}
  const mockSupabaseClient = {}
  const mockProfile = { id: 'profile-id', displayName: 'Test User' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as any)
    vi.mocked(usePublicSupabaseClient).mockReturnValue(
      mockSupabaseClient as any,
    )
    vi.mocked(errorLogging.logErrorWithObservability).mockReturnValue(undefined)
  })

  it('should no-op when on /complete-profile path', () => {
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/complete-profile',
      href: 'http://localhost/complete-profile',
    } as any)
    vi.mocked(authQueries.useCurrentUserQuery).mockReturnValue({
      data: { id: 'user-id' },
    } as any)

    renderHook(() => useEnsureProfileExists())

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should no-op when unauthenticated (no user)', () => {
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/search',
      href: 'http://localhost/search',
    } as any)
    vi.mocked(authQueries.useCurrentUserQuery).mockReturnValue({
      data: null,
    } as any)

    renderHook(() => useEnsureProfileExists())

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should no-op when authenticated with profile', async () => {
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/search',
      href: 'http://localhost/search',
    } as any)
    vi.mocked(authQueries.useCurrentUserQuery).mockReturnValue({
      data: { id: 'user-id' },
    } as any)
    vi.mocked(profileQueries.fetchProfile).mockResolvedValue(mockProfile)

    renderHook(() => useEnsureProfileExists())

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('should redirect to /complete-profile when authenticated without profile', async () => {
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/search',
      href: 'http://localhost/search',
    } as any)
    vi.mocked(authQueries.useCurrentUserQuery).mockReturnValue({
      data: { id: 'user-id' },
    } as any)
    vi.mocked(profileQueries.fetchProfile).mockResolvedValue(null)

    renderHook(() => useEnsureProfileExists())

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/complete-profile',
        search: { next: expect.any(String) },
      })
    })
  })

  it('should silently no-op and log error when profile fetch fails', async () => {
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/search',
      href: 'http://localhost/search',
    } as any)
    vi.mocked(authQueries.useCurrentUserQuery).mockReturnValue({
      data: { id: 'user-id' },
    } as any)
    const fetchError = new Error('Profile fetch failed')
    vi.mocked(profileQueries.fetchProfile).mockRejectedValue(fetchError)

    renderHook(() => useEnsureProfileExists())

    await waitFor(() => {
      expect(errorLogging.logErrorWithObservability).toHaveBeenCalledWith(
        'Profile fetch failed in useEnsureProfileExists',
        fetchError,
        {
          userId: 'user-id',
          path: '/search',
        },
      )
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('should not redirect when in-flight profile fetch resolves after cleanup', async () => {
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/search',
      href: 'http://localhost/search',
    } as any)
    vi.mocked(authQueries.useCurrentUserQuery).mockReturnValue({
      data: { id: 'user-id' },
    } as any)

    let resolveProfile: (value: null) => void = () => {}
    vi.mocked(profileQueries.fetchProfile).mockReturnValue(
      new Promise((resolve) => {
        resolveProfile = resolve
      }) as any,
    )

    const { unmount } = renderHook(() => useEnsureProfileExists())

    unmount()
    resolveProfile(null)
    await Promise.resolve()

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should ignore stale in-flight profile fetch after rerender', async () => {
    let currentLocation = {
      pathname: '/search',
      href: 'http://localhost/search',
    }
    let currentUser: { id: string } | null = { id: 'user-id' }

    vi.mocked(useLocation).mockImplementation(() => currentLocation as any)
    vi.mocked(authQueries.useCurrentUserQuery).mockImplementation(
      () => ({ data: currentUser }) as any,
    )

    let resolveProfile: (value: null) => void = () => {}
    vi.mocked(profileQueries.fetchProfile).mockReturnValue(
      new Promise((resolve) => {
        resolveProfile = resolve
      }) as any,
    )

    const { rerender } = renderHook(() => useEnsureProfileExists())

    // Trigger a new effect run that should invalidate the previous async fetch.
    currentLocation = {
      pathname: '/assets',
      href: 'http://localhost/assets',
    }
    currentUser = null
    rerender()

    resolveProfile(null)
    await Promise.resolve()

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should not log error when stale in-flight profile fetch rejects after cleanup', async () => {
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/search',
      href: 'http://localhost/search',
    } as any)
    vi.mocked(authQueries.useCurrentUserQuery).mockReturnValue({
      data: { id: 'user-id' },
    } as any)

    let rejectProfile: (reason?: unknown) => void = () => {}
    vi.mocked(profileQueries.fetchProfile).mockReturnValue(
      new Promise((_, reject) => {
        rejectProfile = reject
      }) as any,
    )

    const { unmount } = renderHook(() => useEnsureProfileExists())

    unmount()
    rejectProfile(new Error('Profile fetch failed after cleanup'))
    await Promise.resolve()

    expect(errorLogging.logErrorWithObservability).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
