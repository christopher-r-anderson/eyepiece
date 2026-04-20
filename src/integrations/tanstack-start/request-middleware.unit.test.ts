import { describe, expect, it, vi } from 'vitest'
import { createDevelopmentServerErrorLoggingMiddleware } from './request-middleware'

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
