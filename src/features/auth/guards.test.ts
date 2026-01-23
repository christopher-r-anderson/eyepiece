import { beforeEach, describe, expect, it, vi } from 'vitest'
import { redirect } from '@tanstack/react-router'
import { requireAnonymous, requireAuthenticated } from './guards'
import { hasServerClaims } from './server/has-server-claims'

// Mock the server function
vi.mock('./server/has-server-claims', () => ({
  hasServerClaims: vi.fn(),
}))

// Mock the router redirect function
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    redirect: vi.fn(),
  }
})

describe('requireAuthenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows access when claims are present', async () => {
    // Setup: User is authorized
    vi.mocked(hasServerClaims).mockResolvedValue(true)

    // Act & Assert: Should not throw
    await expect(
      requireAuthenticated({ location: { href: '/settings' } } as any),
    ).resolves.not.toThrow()

    // Assert: Redirect should not have been called
    expect(redirect).not.toHaveBeenCalled()
  })

  it('redirects to login when claims are missing', async () => {
    // Setup: User is NOT authorized
    vi.mocked(hasServerClaims).mockResolvedValue(false)

    // Setup: Mock redirect to return a specific error object we can identify
    const mockRedirectError = { isRedirect: true, to: '/login' }
    vi.mocked(redirect).mockReturnValue(mockRedirectError as any)

    // Act & Assert: Should throw the redirect object
    await expect(
      requireAuthenticated({ location: { href: '/settings' } } as any),
    ).rejects.toEqual(mockRedirectError)

    // Assert: Redirect called with correct params
    expect(redirect).toHaveBeenCalledWith({
      to: '/login',
      search: { next: '/settings' },
    })
  })
})

describe('requireAnonymous', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows access when user is anonymous', async () => {
    // Setup: User is NOT authorized
    vi.mocked(hasServerClaims).mockResolvedValue(false)

    // Act & Assert
    await expect(requireAnonymous({ search: {} })).resolves.not.toThrow()

    expect(redirect).not.toHaveBeenCalled()
  })

  it('redirects to next param when user is authorized', async () => {
    // Setup: User IS authorized
    vi.mocked(hasServerClaims).mockResolvedValue(true)
    const mockRedirectError = { isRedirect: true, to: '/dashboard' }
    vi.mocked(redirect).mockReturnValue(mockRedirectError as any)

    // Act & Assert
    await expect(
      requireAnonymous({ search: { next: '/dashboard' } }),
    ).rejects.toEqual(mockRedirectError)

    expect(redirect).toHaveBeenCalledWith({
      to: '/dashboard',
      statusCode: 302,
    })
  })

  it('redirects to home when user is authorized and no next param', async () => {
    // Setup: User IS authorized
    vi.mocked(hasServerClaims).mockResolvedValue(true)
    const mockRedirectError = { isRedirect: true, to: '/' }
    vi.mocked(redirect).mockReturnValue(mockRedirectError as any)

    // Act & Assert
    await expect(requireAnonymous({ search: {} })).rejects.toEqual(
      mockRedirectError,
    )

    expect(redirect).toHaveBeenCalledWith({
      to: '/',
      statusCode: 302,
    })
  })
})
