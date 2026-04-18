import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { buildUrlSearchParamsMiddleware } from './middleware'
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
