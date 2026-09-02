import { describe, expect, it, vi } from 'vitest'
import {
  createDevelopmentServerErrorLoggingMiddleware,
  createErrorResponseCacheSafetyMiddleware,
  createRequestAttributionMiddleware,
  createSessionReadTripwireMiddleware,
  createSetCookieSafetyNetMiddleware,
} from './request-middleware'
import { describeCurrentRequest } from '@/server/lib/request-attribution'
import { markSessionRead } from '@/server/lib/session-read-sentinel'

vi.mock('@tanstack/react-start', () => ({
  createMiddleware: () => ({
    server: (handler: unknown) => handler,
  }),
}))

// TanStack Start's request-middleware next() resolves the mutable middleware
// context object with the outgoing Response at ctx.response — not the
// Response itself. These tests encode that contract; treating the result as
// a Response is the bug class that made these middlewares silent no-ops.
function nextWithResponse(response: Response) {
  const ctx = { request: undefined, response, context: {} }
  return { ctx, next: vi.fn().mockResolvedValue(ctx) }
}

describe('createRequestAttributionMiddleware', () => {
  it('scopes the request around the rest of the chain', async () => {
    const middleware = createRequestAttributionMiddleware() as any
    let seen = ''
    const next = vi.fn(() => {
      seen = describeCurrentRequest()
      return Promise.resolve({ response: new Response(null) })
    })

    await middleware({
      request: new Request('https://example.com/api/v1/asset/nasa_ivl/x', {
        headers: { referer: 'https://example.com/favorites' },
      }),
      next,
    })

    expect(seen).toBe(
      'during GET /api/v1/asset/nasa_ivl/x referer=https://example.com/favorites',
    )
    expect(describeCurrentRequest()).toBe('')
  })
})

describe('createDevelopmentServerErrorLoggingMiddleware', () => {
  it('does not log successful 2xx responses in development', async () => {
    const middleware = createDevelopmentServerErrorLoggingMiddleware() as any
    const { next } = nextWithResponse(new Response(null, { status: 200 }))
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
    const { next } = nextWithResponse(new Response(null, { status: 302 }))
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
    const { next } = nextWithResponse(new Response(null, { status: 500 }))
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
    const { next } = nextWithResponse(new Response(null, { status: 400 }))
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
    const { next } = nextWithResponse(new Response(null, { status: 500 }))
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
    const ctx = { response, context: {} }
    const next = vi.fn().mockImplementation(() => {
      markSessionRead('createUserSupabaseServerClient')
      return Promise.resolve(ctx)
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = await middleware({
      request: new Request('https://example.com/assets/nasa_ivl/123'),
      next,
    })

    expect(result.response.headers.get('cache-control')).toBe(
      'private, no-store',
    )
    expect(result.response.headers.get('netlify-cdn-cache-control')).toBeNull()
    expect(consoleError).toHaveBeenCalledWith(
      'Session read on a publicly-cacheable response; downgrading to private, no-store',
      expect.objectContaining({
        request: 'GET /assets/nasa_ivl/123',
        cacheControl: 'public, max-age=0, s-maxage=300',
        sessionReadReasons: ['createUserSupabaseServerClient'],
      }),
    )

    consoleError.mockRestore()
  })

  it('stamps private, no-store without reporting when a session-reading response has no cache-control', async () => {
    const middleware = createSessionReadTripwireMiddleware() as any
    const ctx = {
      response: new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
      context: {},
    }
    const next = vi.fn().mockImplementation(() => {
      markSessionRead('createUserSupabaseServerClient')
      return Promise.resolve(ctx)
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = await middleware({
      request: new Request('https://example.com/_serverFn/toggle-favorite'),
      next,
    })

    expect(result.response.headers.get('cache-control')).toBe(
      'private, no-store',
    )
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })

  it('stamps redirect responses that read the session (auth guard redirects)', async () => {
    const middleware = createSessionReadTripwireMiddleware() as any
    const ctx = {
      response: new Response(null, {
        status: 307,
        headers: { location: '/login?next=%2Ffavorites' },
      }),
      context: {},
    }
    const next = vi.fn().mockImplementation(() => {
      markSessionRead('createUserSupabaseServerClient')
      return Promise.resolve(ctx)
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = await middleware({
      request: new Request('https://example.com/favorites'),
      next,
    })

    expect(result.response.headers.get('cache-control')).toBe(
      'private, no-store',
    )
    expect(result.response.headers.get('location')).toBe(
      '/login?next=%2Ffavorites',
    )

    consoleError.mockRestore()
  })

  it('returns the context unchanged when no session was read', async () => {
    const middleware = createSessionReadTripwireMiddleware() as any
    const { ctx, next } = nextWithResponse(
      new Response('<html></html>', {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=0, s-maxage=300',
        },
      }),
    )

    const result = await middleware({
      request: new Request('https://example.com/assets/nasa_ivl/123'),
      next,
    })

    expect(result).toBe(ctx)
    expect(result.response.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=300',
    )
  })

  it('leaves already-private responses untouched and unreported after a session read', async () => {
    const middleware = createSessionReadTripwireMiddleware() as any
    const ctx = {
      response: new Response('<html></html>', {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'private, no-store',
        },
      }),
      context: {},
    }
    const next = vi.fn().mockImplementation(() => {
      markSessionRead('createUserSupabaseServerClient')
      return Promise.resolve(ctx)
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = await middleware({
      request: new Request('https://example.com/favorites'),
      next,
    })

    expect(result).toBe(ctx)
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })

  it('tracks session reads made in async loader work', async () => {
    const middleware = createSessionReadTripwireMiddleware() as any
    const next = vi.fn().mockImplementation(async () => {
      await Promise.resolve()
      markSessionRead('createUserSupabaseServerClient')
      return {
        response: new Response(null, {
          status: 200,
          headers: { 'cache-control': 'public, s-maxage=300' },
        }),
        context: {},
      }
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = await middleware({
      request: new Request('https://example.com/'),
      next,
    })

    expect(result.response.headers.get('cache-control')).toBe(
      'private, no-store',
    )

    consoleError.mockRestore()
  })

  it('also handles a bare Response result defensively', async () => {
    const middleware = createSessionReadTripwireMiddleware() as any
    const next = vi.fn().mockImplementation(() => {
      markSessionRead('createUserSupabaseServerClient')
      return Promise.resolve(
        new Response(null, {
          status: 200,
          headers: { 'cache-control': 'public, s-maxage=300' },
        }),
      )
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = await middleware({
      request: new Request('https://example.com/'),
      next,
    })

    expect(result).toBeInstanceOf(Response)
    expect(result.headers.get('cache-control')).toBe('private, no-store')

    consoleError.mockRestore()
  })
})

describe('createErrorResponseCacheSafetyMiddleware', () => {
  it('downgrades publicly-cacheable error responses to private, no-store', async () => {
    const middleware = createErrorResponseCacheSafetyMiddleware() as any
    const { next } = nextWithResponse(
      new Response('<html></html>', {
        status: 500,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=0, s-maxage=300',
          'netlify-cdn-cache-control': 'public, s-maxage=300, durable',
        },
      }),
    )

    const result = await middleware({
      request: new Request('https://example.com/assets/nasa_ivl/broken'),
      next,
    })

    expect(result.response.headers.get('cache-control')).toBe(
      'private, no-store',
    )
    expect(result.response.headers.get('netlify-cdn-cache-control')).toBeNull()
  })

  it('leaves successful responses untouched', async () => {
    const middleware = createErrorResponseCacheSafetyMiddleware() as any
    const { ctx, next } = nextWithResponse(
      new Response('<html></html>', {
        status: 200,
        headers: {
          'cache-control': 'public, max-age=0, s-maxage=300',
        },
      }),
    )

    const result = await middleware({
      request: new Request('https://example.com/'),
      next,
    })

    expect(result).toBe(ctx)
    expect(result.response.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=300',
    )
  })

  it('leaves error responses without cacheable headers untouched', async () => {
    const middleware = createErrorResponseCacheSafetyMiddleware() as any
    const { ctx, next } = nextWithResponse(
      new Response(null, {
        status: 404,
        headers: { 'cache-control': 'private, no-store' },
      }),
    )

    const result = await middleware({
      request: new Request('https://example.com/missing'),
      next,
    })

    expect(result).toBe(ctx)
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

    const { next } = nextWithResponse(response)

    const result = await middleware({
      request: new Request('https://example.com/auth/confirm'),
      next,
    })

    expect(result.response.headers.get('cache-control')).toBe(
      'private, no-store',
    )
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

    const { next } = nextWithResponse(response)

    const result = await middleware({
      request: new Request('https://example.com/auth/confirm'),
      next,
    })

    expect(result.response.headers.get('cache-control')).toBe(
      'private, no-store',
    )
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

    const { ctx, next } = nextWithResponse(response)

    const result = await middleware({
      request: new Request('https://example.com/auth/confirm'),
      next,
    })

    expect(result).toBe(ctx)
    expect(result.response.headers.get('cache-control')).toBe(
      'public, max-age=300',
    )
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

    const { ctx, next } = nextWithResponse(response)

    const result = await middleware({
      request: new Request('https://example.com/api/v1/search'),
      next,
    })

    expect(result).toBe(ctx)
    expect(result.response.headers.get('cache-control')).toBe(
      'public, max-age=300',
    )
  })
})
