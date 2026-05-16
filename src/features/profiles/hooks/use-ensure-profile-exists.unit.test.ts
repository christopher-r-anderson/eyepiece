import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHydrated, useLocation, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEnsureProfileExists } from './use-ensure-profile-exists'
import * as authQueries from '@/features/auth/auth.queries'
import * as errorLogging from '@/lib/error-logging'
import { makeProfilesCommands } from '@/features/profiles/profiles.commands'
import { useProfilesRepo } from '@/features/profiles/profiles.repo'
import { createUserSupabaseClient } from '@/integrations/supabase/user'
import { Err, Ok } from '@/lib/result'

vi.mock('@/features/auth/auth.queries')
vi.mock('@/lib/error-logging')
vi.mock('@/features/profiles/profiles.commands')
vi.mock('@/features/profiles/profiles.repo')
vi.mock('@tanstack/react-router')
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(),
    useQueryClient: vi.fn(),
  }
})
vi.mock('@/integrations/supabase/user')
vi.mock('@/lib/utils', () => ({
  urlToNextParam: vi.fn((url) => `/mocked?next=${url}`),
}))

describe('useEnsureProfileExists', () => {
  const mockNavigate = vi.fn()
  const mockUserSupabaseClient = {}
  const mockQueryClient = {
    setQueryData: vi.fn(),
    removeQueries: vi.fn(),
  }
  const mockExistingProfile = { id: 'user-id', displayName: 'Test User' }
  const mockCreatedProfile = { id: 'user-id', displayName: 'Explorer user-id' }

  const mockGetProfile = vi.fn()
  const mockUpsertProfile = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useHydrated).mockReturnValue(true)
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(createUserSupabaseClient).mockReturnValue(
      mockUserSupabaseClient as any,
    )
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as any)
    vi.mocked(useProfilesRepo).mockReturnValue({
      getProfile: mockGetProfile,
    } as any)
    vi.mocked(makeProfilesCommands).mockReturnValue({
      upsertProfile: mockUpsertProfile,
    } as any)
    vi.mocked(errorLogging.logErrorWithObservability).mockReturnValue(undefined)

    vi.mocked(useLocation).mockReturnValue({
      pathname: '/search',
      href: 'http://localhost/search',
    } as any)

    vi.mocked(authQueries.useCurrentUserQuery).mockReturnValue({
      data: { id: 'user-id', email: 'test@example.com' },
    } as any)

    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isSuccess: false,
      isError: false,
      error: null,
    } as any)
  })

  it('disables profile ensure query when not hydrated', () => {
    vi.mocked(useHydrated).mockReturnValue(false)

    renderHook(() => useEnsureProfileExists())

    const options = vi.mocked(useQuery).mock.calls[0]?.[0] as any
    expect(options.enabled).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('disables profile ensure query when unauthenticated', () => {
    vi.mocked(authQueries.useCurrentUserQuery).mockReturnValue({
      data: null,
    } as any)

    renderHook(() => useEnsureProfileExists())

    const options = vi.mocked(useQuery).mock.calls[0]?.[0] as any
    expect(options.enabled).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('disables profile ensure query on /complete-profile path', () => {
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/complete-profile',
      href: 'http://localhost/complete-profile',
    } as any)

    renderHook(() => useEnsureProfileExists())

    const options = vi.mocked(useQuery).mock.calls[0]?.[0] as any
    expect(options.enabled).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('uses fresh-query options to avoid stale null redirect loops', () => {
    renderHook(() => useEnsureProfileExists())

    const options = vi.mocked(useQuery).mock.calls[0]?.[0] as any
    expect(options.staleTime).toBe(0)
    expect(options.refetchOnMount).toBe('always')
    expect(options.retry).toBe(false)
    expect(options.enabled).toBe(true)
  })

  it('does not redirect when ensure query returns an existing profile', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: mockExistingProfile,
      isSuccess: true,
      isError: false,
      error: null,
    } as any)

    renderHook(() => useEnsureProfileExists())

    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
      ['profiles', 'detail', 'user-id'],
      mockExistingProfile,
    )
    expect(mockQueryClient.removeQueries).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('redirects to /complete-profile when ensure query resolves with null', async () => {
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isSuccess: true,
      isError: false,
      error: null,
    } as any)

    renderHook(() => useEnsureProfileExists())

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/complete-profile',
        search: { next: expect.any(String) },
      })
    })
    expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: ['profiles', 'detail', 'user-id'],
      exact: true,
    })
    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
  })

  it('logs and no-ops when ensure query errors', async () => {
    const ensureError = new Error('Profile ensure failed')
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isSuccess: false,
      isError: true,
      error: ensureError,
    } as any)

    renderHook(() => useEnsureProfileExists())

    await waitFor(() => {
      expect(errorLogging.logErrorWithObservability).toHaveBeenCalledWith(
        'Profile ensure/create failed in useEnsureProfileExists',
        ensureError,
        {
          userId: 'user-id',
          path: '/search',
        },
      )
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('queryFn returns existing profile and does not attempt create', async () => {
    mockGetProfile.mockResolvedValue(Ok(mockExistingProfile))

    renderHook(() => useEnsureProfileExists())

    const options = vi.mocked(useQuery).mock.calls[0]?.[0] as any
    const result = await options.queryFn()

    expect(result).toEqual(mockExistingProfile)
    expect(mockUpsertProfile).not.toHaveBeenCalled()
  })

  it('queryFn creates a profile when missing and returns created data', async () => {
    mockGetProfile.mockResolvedValue(Ok(null))
    mockUpsertProfile.mockResolvedValue(Ok(mockCreatedProfile))

    renderHook(() => useEnsureProfileExists())

    const options = vi.mocked(useQuery).mock.calls[0]?.[0] as any
    const result = await options.queryFn()

    expect(result).toEqual(mockCreatedProfile)
    expect(createUserSupabaseClient).toHaveBeenCalledTimes(1)
    expect(mockUpsertProfile).toHaveBeenCalledWith({
      id: 'user-id',
      displayName: 'Explorer user-id',
    })
  })

  it('queryFn returns null on invalid_input create failure', async () => {
    mockGetProfile.mockResolvedValue(Ok(null))
    mockUpsertProfile.mockResolvedValue(
      Err({ code: 'invalid_input', message: 'Invalid input' }),
    )

    renderHook(() => useEnsureProfileExists())

    const options = vi.mocked(useQuery).mock.calls[0]?.[0] as any
    const result = await options.queryFn()

    expect(result).toBeNull()
  })

  it('queryFn throws when profile lookup fails unexpectedly', async () => {
    mockGetProfile.mockResolvedValue(
      Err({ code: 'unknown_error', message: 'Lookup failed' }),
    )

    renderHook(() => useEnsureProfileExists())

    const options = vi.mocked(useQuery).mock.calls[0]?.[0] as any

    await expect(options.queryFn()).rejects.toMatchObject({
      message: 'Lookup failed',
    })
  })
})
