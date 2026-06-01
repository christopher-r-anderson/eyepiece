import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockVerifyOtp = vi.fn()
const mockUpsertProfile = vi.fn()
const mockLogErrorWithObservability = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
  redirect: (options: { headers?: HeadersInit; statusCode?: number }) => {
    const response = new Response(null, {
      headers: options.headers,
      status: options.statusCode,
    })

    return Object.assign(response, { options })
  },
}))

vi.mock('@/integrations/supabase/user/server.server', () => ({
  createUserSupabaseServerClient: () => ({
    auth: {
      verifyOtp: mockVerifyOtp,
    },
  }),
}))

vi.mock('@/features/profiles/profiles.commands', () => ({
  makeProfilesCommands: () => ({
    upsertProfile: mockUpsertProfile,
  }),
}))

vi.mock('@/lib/error-logging', () => ({
  logErrorWithObservability: mockLogErrorWithObservability,
}))

const { Route } = await import('./confirm')
const handler = (Route as any).server.handlers.GET

describe('GET /auth/confirm handler', () => {
  beforeEach(() => {
    mockVerifyOtp.mockReset()
    mockUpsertProfile.mockReset()
    mockLogErrorWithObservability.mockReset()
  })

  it('returns a private no-store 500 response for unexpected errors', async () => {
    const error = new Error('boom')
    mockVerifyOtp.mockRejectedValue(error)

    const response = await handler({
      request: new Request(
        'https://example.com/auth/confirm?token_hash=valid-token&type=email',
      ),
    })

    expect(response.status).toBe(500)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected server error.',
      },
    })
    expect(mockLogErrorWithObservability).toHaveBeenCalledWith(
      'Token callback handler failed unexpectedly',
      error,
      {
        request:
          'https://example.com/auth/confirm?token_hash=valid-token&type=email',
      },
    )
  })

  it('rethrows redirect responses with private no-store cache control', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    await expect(
      handler({
        request: new Request(
          'https://example.com/auth/confirm?token_hash=valid-token&type=email',
        ),
      }),
    ).rejects.toBeInstanceOf(Response)

    try {
      await handler({
        request: new Request(
          'https://example.com/auth/confirm?token_hash=valid-token&type=email',
        ),
      })
    } catch (error) {
      const response = error as Response & {
        options?: { href?: string }
      }

      expect(response.status).toBe(303)
      expect(response.headers.get('Cache-Control')).toBe('private, no-store')
      expect(response.options?.href).toBe('/login?next=%2F')
    }
  })
})
