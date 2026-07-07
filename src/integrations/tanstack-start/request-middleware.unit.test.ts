import { describe, expect, it, vi } from 'vitest'
import {
  createDevelopmentServerErrorLoggingMiddleware,
  createSessionReadTripwireMiddleware,
  createSetCookieSafetyNetMiddleware,
} from './request-middleware'
import { markSessionRead } from '@/server/lib/session-read-sentinel'

vi.mock('@tanstack/react-start', () => ({
  createMiddleware: () => ({
    server: (handler: unknown) => handler,
  }),
}))

describe('createDevelopmentServerErrorLoggingMiddleware', () => {
  it('does not log successful 2xx responses in development', async () => {
    const middleware = createDevelopmentServerErrorLoggingMiddleware() as any
    const next = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const nodeEnv = process.env.NODE_ENV

    process.env.NODE_ENV = 'development'

    await middleware({
      request: new Request(
        'https://example.com/dev/observability/server-error',
      ),
      next,
    })

    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
    process.env.NODE_ENV = nodeEnv
  })

  it('does not log redirect 3xx responses in development', async () => {
    const middleware = createDevelopmentServerErrorLoggingMiddleware() as any
    const next = vi.fn().mockResolvedValue(new Response(null, { status: 302 }))
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const nodeEnv = process.env.NODE_ENV

    process.env.NODE_ENV = 'development'

    await middleware({
      request: new Request(
        'https://example.com/dev/observability/server-error',
      ),
      next,
    })

    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
    process.env.NODE_ENV = nodeEnv
  })

  it('logs reportable 5xx responses in development', async () => {
    const middleware = createDevelopmentServerErrorLoggingMiddleware() as any
    const next = vi.fn().mockResolvedValue(new Response(null, { status: 500 }))
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const nodeEnv = process.env.NODE_ENV

    process.env.NODE_ENV = 'development'

    await middleware({
      request: new Request(
        'https://example.com/dev/observability/server-error',
      ),
      next,
    })

    expect(consoleError).toHaveBeenCalledWith('[dev-server-error]', {
      request: 'GET /dev/observability/server-error',
      source: 'response',
      status: 500,
    })

    consoleError.mockRestore()
    process.env.NODE_ENV = nodeEnv
  })

  it('does not log handled 4xx responses in development', async () => {
    const middleware = createDevelopmentServerErrorLoggingMiddleware() as any
    const next = vi.fn().mockResolvedValue(new Response(null, { status: 400 }))
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const nodeEnv = process.env.NODE_ENV

    process.env.NODE_ENV = 'development'

    await middleware({
      request: new Request('https://example.com/dev/observability/handled-400'),
      next,
    })

    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
    process.env.NODE_ENV = nodeEnv
  })

  it('logs reportable thrown exceptions in development and rethrows them', async () => {
    const middleware = createDevelopmentServerErrorLoggingMiddleware() as any
    const error = new Error('boom')
    const next = vi.fn().mockRejectedValue(error)
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const nodeEnv = process.env.NODE_ENV

    process.env.NODE_ENV = 'development'

    await expect(
      middleware({
        request: new Request(
          'https://example.com/dev/observability/server-error',
        ),
        next,
      }),
    ).rejects.toThrow('boom')

    expect(consoleError).toHaveBeenCalledWith('[dev-server-error]', {
      request: 'GET /dev/observability/server-error',
      source: 'exception',
      error,
    })

    consoleError.mockRestore()
    process.env.NODE_ENV = nodeEnv
  })

  it('does not log in production', async () => {
    const middleware = createDevelopmentServerErrorLoggingMiddleware() as any
    const next = vi.fn().mockResolvedValue(new Response(null, { status: 500 }))
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const nodeEnv = process.env.NODE_ENV

    process.env.NODE_ENV = 'production'

    await middleware({
      request: new Request(
        'https://example.com/dev/observability/server-error',
      ),
      next,
    })

    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
    process.env.NODE_ENV = nodeEnv
  })
})

describe('createSessionReadTripwireMiddleware', () => {
  it('downgrades and reports publicly-cacheable responses that read the session', async () => {
    const middleware = createSessionReadTripwireMiddleware() as any
    const response = new Response('<html></html>', {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=300',
        'netlify-cdn-cache-control': 'public, s-maxage=300',
      },
    })
    const next = vi.fn().mockImplementation(() => {
      markSessionRead('createUserSupabaseServerClient')
      return Promise.resolve(response)
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = await middleware({
      request: new Request('https://example.com/assets/nasa/123'),
      next,
    })

    expect(result.headers.get('cache-control')).toBe('private, no-store')
    expect(result.headers.get('netlify-cdn-cache-control')).toBeNull()
    expect(consoleError).toHaveBeenCalledWith(
      'Session read on a publicly-cacheable response; downgrading to private, no-store',
      expect.objectContaining({
        request: 'GET /assets/nasa/123',
        cacheControl: 'public, max-age=0, s-maxage=300',
        sessionReadReasons: ['createUserSupabaseServerClient'],
      }),
    )

    consoleError.mockRestore()
  })

  it('stamps private, no-store without reporting when a session-reading response has no cache-control', async () => {
    const middleware = createSessionReadTripwireMiddleware() as any
    const response = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
    const next = vi.fn().mockImplementation(() => {
      markSessionRead('createUserSupabaseServerClient')
      return Promise.resolve(response)
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = await middleware({
      request: new Request('https://example.com/_serverFn/toggle-favorite'),
      next,
    })

    expect(result.headers.get('cache-control')).toBe('private, no-store')
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })

  it('returns responses unchanged when no session was read', async () => {
    const middleware = createSessionReadTripwireMiddleware() as any
    const response = new Response('<html></html>', {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=300',
      },
    })
    const next = vi.fn().mockResolvedValue(response)

    const result = await middleware({
      request: new Request('https://example.com/assets/nasa/123'),
      next,
    })

    expect(result).toBe(response)
    expect(result.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=300',
    )
  })

  it('leaves already-private responses untouched and unreported after a session read', async () => {
    const middleware = createSessionReadTripwireMiddleware() as any
    const response = new Response('<html></html>', {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'private, no-store',
      },
    })
    const next = vi.fn().mockImplementation(() => {
      markSessionRead('createUserSupabaseServerClient')
      return Promise.resolve(response)
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = await middleware({
      request: new Request('https://example.com/favorites'),
      next,
    })

    expect(result).toBe(response)
    expect(result.headers.get('cache-control')).toBe('private, no-store')
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })

  it('tracks session reads made in async loader work', async () => {
    const middleware = createSessionReadTripwireMiddleware() as any
    const next = vi.fn().mockImplementation(async () => {
      await Promise.resolve()
      markSessionRead('createUserSupabaseServerClient')
      return new Response(null, {
        status: 200,
        headers: { 'cache-control': 'public, s-maxage=300' },
      })
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = await middleware({
      request: new Request('https://example.com/'),
      next,
    })

    expect(result.headers.get('cache-control')).toBe('private, no-store')

    consoleError.mockRestore()
  })
})

describe('createSetCookieSafetyNetMiddleware', () => {
  it('overrides cache-control for HTML responses that set Supabase auth cookies', async () => {
    const middleware = createSetCookieSafetyNetMiddleware() as any
    const response = new Response('<html></html>', {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    })
    response.headers.append('set-cookie', 'foo=bar; Path=/')
    response.headers.append('set-cookie', 'sb-auth-token=abc; Path=/; HttpOnly')

    const next = vi.fn().mockResolvedValue(response)

    const result = await middleware({
      request: new Request('https://example.com/auth/confirm'),
      next,
    })

    expect(result.headers.get('cache-control')).toBe('private, no-store')
  })

  it('overrides cache-control for redirect responses that set Supabase auth cookies', async () => {
    const middleware = createSetCookieSafetyNetMiddleware() as any
    const response = new Response(null, {
      status: 302,
      headers: {
        location: '/settings/profile',
        'cache-control': 'public, max-age=300',
      },
    })
    response.headers.append('set-cookie', 'sb-auth-token=abc; Path=/; HttpOnly')

    const next = vi.fn().mockResolvedValue(response)

    const result = await middleware({
      request: new Request('https://example.com/auth/confirm'),
      next,
    })

    expect(result.headers.get('cache-control')).toBe('private, no-store')
  })

  it('keeps cache-control unchanged for HTML responses without Supabase auth cookies', async () => {
    const middleware = createSetCookieSafetyNetMiddleware() as any
    const response = new Response('<html></html>', {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    })
    response.headers.append('set-cookie', 'foo=bar; Path=/')

    const next = vi.fn().mockResolvedValue(response)

    const result = await middleware({
      request: new Request('https://example.com/auth/confirm'),
      next,
    })

    expect(result.headers.get('cache-control')).toBe('public, max-age=300')
  })

  it('returns non-HTML responses unchanged even when Supabase auth cookies are set', async () => {
    const middleware = createSetCookieSafetyNetMiddleware() as any
    const response = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=300',
      },
    })
    response.headers.append('set-cookie', 'sb-auth-token=abc; Path=/; HttpOnly')

    const next = vi.fn().mockResolvedValue(response)

    const result = await middleware({
      request: new Request('https://example.com/api/v1/search'),
      next,
    })

    expect(result).toBe(response)
    expect(result.headers.get('cache-control')).toBe('public, max-age=300')
  })
})
