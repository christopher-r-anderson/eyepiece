import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import {
  buildPublicApiCacheMiddleware,
  buildUrlSearchParamsMiddleware,
} from './middleware'
import { shouldReportError } from '@/lib/error-observability'

vi.mock('@tanstack/react-start', () => ({
  createMiddleware: () => ({
    server: (handler: unknown) => handler,
  }),
}))

describe('buildUrlSearchParamsMiddleware', () => {
  it('parses search params and passes them to next as context', async () => {
    const middleware = buildUrlSearchParamsMiddleware(
      z.object({ page: z.coerce.number(), q: z.string() }),
    ) as any
    const next = vi.fn().mockResolvedValue('ok')

    const result = await middleware({
      request: new Request('https://example.com/api/search?page=2&q=apollo'),
      next,
    })

    expect(next).toHaveBeenCalledWith({
      context: {
        searchParams: { page: 2, q: 'apollo' },
      },
    })
    expect(result).toBe('ok')
  })

  it('returns a 400 response when search params are invalid', async () => {
    const middleware = buildUrlSearchParamsMiddleware(
      z.object({ page: z.coerce.number().min(1) }),
    ) as any
    const next = vi.fn()

    const response = await middleware({
      request: new Request('https://example.com/api/search?page=0'),
      next,
    })

    expect(response.status).toBe(400)
    expect(next).not.toHaveBeenCalled()

    const body = await response.json()
    expect(body.error.code).toBe('INVALID_QUERY_PARAMS')
    expect(body.error.issues[0].path).toBe('page')
    expect(body.error.issues[0].message).toMatch('Too small')
    expect(shouldReportError(response)).toBe(false)
  })
})

describe('buildPublicApiCacheMiddleware', () => {
  it('adds public cache control to returned responses', async () => {
    const middleware = buildPublicApiCacheMiddleware() as any

    const response = await middleware({
      next: vi.fn().mockResolvedValue(Response.json({ ok: true })),
    })

    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=300, stale-while-revalidate=300',
    )
  })

  it('adds public cache control to middleware result.response values', async () => {
    const middleware = buildPublicApiCacheMiddleware() as any

    const result = await middleware({
      next: vi.fn().mockResolvedValue({
        response: Response.json({ ok: true }),
      }),
    })

    expect(result.response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=300, stale-while-revalidate=300',
    )
  })

  it('adds public cache control to thrown responses', async () => {
    const middleware = buildPublicApiCacheMiddleware() as any

    await expect(
      middleware({
        next: vi
          .fn()
          .mockRejectedValue(
            Response.json(
              { error: { code: 'INVALID_INPUT' } },
              { status: 400 },
            ),
          ),
      }),
    ).rejects.toMatchObject({
      headers: expect.objectContaining({}),
      status: 400,
    })

    try {
      await middleware({
        next: vi
          .fn()
          .mockRejectedValue(
            Response.json(
              { error: { code: 'INVALID_INPUT' } },
              { status: 400 },
            ),
          ),
      })
    } catch (error) {
      const response = error as Response

      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=0, s-maxage=300, stale-while-revalidate=300',
      )
    }
  })
})
