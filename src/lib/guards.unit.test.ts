import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireAuthenticated, userHasProfile } from './guards'

// Keep the real redirect so the thrown value has the shape guards produce.
// We check thrown objects via toMatchObject so exact class doesn't matter.

import { getUser } from '@/features/auth/get-user'
import { fetchCurrentUser } from '@/features/auth/auth.queries'
import { fetchProfile } from '@/features/profiles/profiles.queries'
import { logErrorWithObservability } from '@/lib/error-logging'

// ---------------------------------------------------------------------------
// Module mocks

vi.mock('@/features/auth/get-user', () => ({
  getUser: vi.fn(),
}))

vi.mock('@/features/auth/auth.queries', () => ({
  fetchCurrentUser: vi.fn(),
}))

vi.mock('@/features/profiles/profiles.queries', () => ({
  fetchProfile: vi.fn(),
}))

vi.mock('@/lib/error-logging', () => ({
  logErrorWithObservability: vi.fn(),
}))

const mockGetUser = vi.mocked(getUser)
const mockFetchCurrentUser = vi.mocked(fetchCurrentUser)
const mockFetchProfile = vi.mocked(fetchProfile)
const mockLogErrorWithObservability = vi.mocked(logErrorWithObservability)

const USER = { id: 'user-uuid-123', email: 'test@example.com' }

// Minimal ParsedLocation shape used by guards
function makeLocation(href: string) {
  const pathname = href.split('?')[0] ?? href
  return { href, pathname } as any
}

// ---------------------------------------------------------------------------
// requireAuthenticated
// ---------------------------------------------------------------------------

describe('requireAuthenticated', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockLogErrorWithObservability.mockReset()
  })

  it('returns the user when authenticated', async () => {
    mockGetUser.mockResolvedValue(USER as any)

    const result = await requireAuthenticated({
      location: makeLocation('/settings'),
    })

    expect(result).toEqual({ user: USER })
  })

  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValue(null)

    await expect(
      requireAuthenticated({ location: makeLocation('/settings') }),
    ).rejects.toMatchObject({ options: { to: '/login' } })
  })

  it('includes the current path as the next param when redirecting', async () => {
    mockGetUser.mockResolvedValue(null)

    await expect(
      requireAuthenticated({ location: makeLocation('/settings') }),
    ).rejects.toMatchObject({ options: { search: { next: '/settings' } } })
  })

  it('strips auth-related params from the next param', async () => {
    mockGetUser.mockResolvedValue(null)

    await expect(
      requireAuthenticated({
        location: makeLocation('/settings?auth=abc&query=foo'),
      }),
    ).rejects.toMatchObject({
      options: { search: { next: '/settings?query=foo' } },
    })
  })

  it('logs and redirects to login when getUser throws an unexpected error', async () => {
    const error = new Error('supabase unavailable')
    mockGetUser.mockRejectedValue(error)

    await expect(
      requireAuthenticated({
        location: makeLocation('/settings?query=foo'),
      }),
    ).rejects.toMatchObject({
      options: { to: '/login', search: { next: '/settings?query=foo' } },
    })

    expect(mockLogErrorWithObservability).toHaveBeenCalledWith(
      'Unexpected error in requireAuthenticated',
      error,
      {
        path: '/settings?query=foo',
      },
    )
  })
})

// ---------------------------------------------------------------------------
// userHasProfile
// ---------------------------------------------------------------------------

describe('userHasProfile', () => {
  const queryClient = {} as any
  const publicSupabaseClient = {} as any
  const context = { queryClient, publicSupabaseClient }

  beforeEach(() => {
    mockFetchCurrentUser.mockReset()
    mockFetchProfile.mockReset()
  })

  it('does not throw when there is no authenticated user', async () => {
    mockFetchCurrentUser.mockResolvedValue(null)

    await expect(
      userHasProfile({ context, location: makeLocation('/favorites') }),
    ).resolves.toBeUndefined()
  })

  it('does not throw when the user already has a profile', async () => {
    mockFetchCurrentUser.mockResolvedValue(USER as any)
    mockFetchProfile.mockResolvedValue({
      id: USER.id,
      displayName: 'Ada',
    } as any)

    await expect(
      userHasProfile({ context, location: makeLocation('/favorites') }),
    ).resolves.toBeUndefined()
  })

  it('redirects to /complete-profile when the user has no profile', async () => {
    mockFetchCurrentUser.mockResolvedValue(USER as any)
    mockFetchProfile.mockResolvedValue(null)

    await expect(
      userHasProfile({ context, location: makeLocation('/favorites') }),
    ).rejects.toMatchObject({ options: { to: '/complete-profile' } })
  })

  it('includes the current path as the next param when redirecting to complete-profile', async () => {
    mockFetchCurrentUser.mockResolvedValue(USER as any)
    mockFetchProfile.mockResolvedValue(null)

    await expect(
      userHasProfile({ context, location: makeLocation('/favorites') }),
    ).rejects.toMatchObject({
      options: { search: { next: '/favorites' } },
    })
  })

  it('does not redirect when already on /complete-profile', async () => {
    await expect(
      userHasProfile({
        context,
        location: makeLocation('/complete-profile?next=/favorites'),
      }),
    ).resolves.toBeUndefined()

    expect(mockFetchCurrentUser).not.toHaveBeenCalled()
    expect(mockFetchProfile).not.toHaveBeenCalled()
  })
})
