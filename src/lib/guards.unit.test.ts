import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  requireAnonymous,
  requireAuthenticated,
  userHasProfile,
} from './guards'

// Keep the real redirect so the thrown value has the shape guards produce.
// We check thrown objects via toMatchObject so exact class doesn't matter.

import { getUser } from '@/features/auth/get-user'
import { hasServerClaims } from '@/lib/has-server-claims.functions'
import { fetchCurrentUser } from '@/features/auth/auth.queries'
import { fetchProfile } from '@/features/profiles/profiles.queries'

// ---------------------------------------------------------------------------
// Module mocks

vi.mock('@/features/auth/get-user', () => ({
  getUser: vi.fn(),
}))

vi.mock('@/lib/has-server-claims.functions', () => ({
  hasServerClaims: vi.fn(),
}))

vi.mock('@/features/auth/auth.queries', () => ({
  fetchCurrentUser: vi.fn(),
}))

vi.mock('@/features/profiles/profiles.queries', () => ({
  fetchProfile: vi.fn(),
}))

const mockGetUser = vi.mocked(getUser)
const mockHasServerClaims = vi.mocked(hasServerClaims)
const mockFetchCurrentUser = vi.mocked(fetchCurrentUser)
const mockFetchProfile = vi.mocked(fetchProfile)

const USER = { id: 'user-uuid-123', email: 'test@example.com' }

// Minimal ParsedLocation shape used by guards
function makeLocation(href: string) {
  return { href } as any
}

// ---------------------------------------------------------------------------
// requireAuthenticated
// ---------------------------------------------------------------------------

describe('requireAuthenticated', () => {
  beforeEach(() => mockGetUser.mockReset())

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
})

// ---------------------------------------------------------------------------
// requireAnonymous
// ---------------------------------------------------------------------------

describe('requireAnonymous', () => {
  beforeEach(() => mockHasServerClaims.mockReset())

  it('does not throw when the user is not authenticated', async () => {
    mockHasServerClaims.mockResolvedValue(false)

    await expect(requireAnonymous({ search: {} })).resolves.toBeUndefined()
  })

  it('redirects to / when already authenticated and no next param is present', async () => {
    mockHasServerClaims.mockResolvedValue(true)

    await expect(requireAnonymous({ search: {} })).rejects.toMatchObject({
      options: { to: '/' },
    })
  })

  it('redirects to the next param path when already authenticated', async () => {
    mockHasServerClaims.mockResolvedValue(true)

    await expect(
      requireAnonymous({ search: { next: '/albums' } }),
    ).rejects.toMatchObject({ options: { to: '/albums' } })
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
})
