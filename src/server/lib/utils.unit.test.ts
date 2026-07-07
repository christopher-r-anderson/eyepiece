import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import {
  createPrivateNoStoreHeaders,
  createPublicCacheHeaders,
  parseOrThrowBadRequest,
  parseOrThrowProviderId,
  withPrivateNoStoreCacheControl,
  withPublicCacheControl,
} from './utils'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { shouldReportError } from '@/lib/error-observability'

describe('private no-store helpers', () => {
  it('adds private no-store cache control to new headers', () => {
    const headers = createPrivateNoStoreHeaders({ Vary: 'Accept' })

    expect(headers.get('Cache-Control')).toBe('private, no-store')
    expect(headers.get('Vary')).toBe('Accept')
  })

  it('adds private no-store cache control to an existing response', () => {
    const response = new Response(null, {
      headers: { Location: '/login' },
      status: 303,
    })

    const updatedResponse = withPrivateNoStoreCacheControl(response)

    expect(updatedResponse.headers.get('Cache-Control')).toBe(
      'private, no-store',
    )
    expect(updatedResponse.headers.get('Location')).toBe('/login')
  })

  it('strips CDN cache headers when downgrading to private', () => {
    const response = new Response(null, {
      headers: {
        'Cache-Control': 'public, s-maxage=300',
        'Netlify-CDN-Cache-Control': 'public, s-maxage=300, durable',
      },
    })

    const updatedResponse = withPrivateNoStoreCacheControl(response)

    expect(updatedResponse.headers.get('Cache-Control')).toBe(
      'private, no-store',
    )
    expect(updatedResponse.headers.get('Netlify-CDN-Cache-Control')).toBeNull()
  })

  it('downgrades responses with immutable headers by rebuilding them', () => {
    const response = new Response(null, {
      headers: { Location: '/login' },
      status: 303,
    })
    response.headers.set = () => {
      throw new TypeError('immutable')
    }

    const updatedResponse = withPrivateNoStoreCacheControl(response)

    expect(updatedResponse.headers.get('Cache-Control')).toBe(
      'private, no-store',
    )
    expect(updatedResponse.headers.get('Location')).toBe('/login')
    expect(updatedResponse.status).toBe(303)
  })
})

describe('public cache helpers', () => {
  it('adds both public cache headers to new headers', () => {
    const headers = createPublicCacheHeaders({ Vary: 'Accept' })

    expect(headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=300, stale-while-revalidate=300',
    )
    expect(headers.get('Netlify-CDN-Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=300, durable',
    )
    expect(headers.get('Vary')).toBe('Accept')
  })

  it('adds both public cache headers to an existing response', () => {
    const response = new Response(null, { status: 200 })

    const updatedResponse = withPublicCacheControl(response)

    expect(updatedResponse.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=300, stale-while-revalidate=300',
    )
    expect(updatedResponse.headers.get('Netlify-CDN-Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=300, durable',
    )
  })

  it('respects a custom public cache profile', () => {
    const response = new Response(null, { status: 200 })

    const updatedResponse = withPublicCacheControl(response, {
      maxAge: 0,
      sMaxAge: 60,
      staleWhileRevalidate: 120,
    })

    expect(updatedResponse.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
    )
    expect(updatedResponse.headers.get('Netlify-CDN-Cache-Control')).toBe(
      'public, s-maxage=60, stale-while-revalidate=120, durable',
    )
  })
})

describe('parseOrThrowBadRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed data when the input is valid', () => {
    const schema = z.object({ page: z.coerce.number().min(1) })

    const result = parseOrThrowBadRequest(schema, { page: '2' })

    expect(result).toEqual({ page: 2 })
  })

  it('throws a 400 Response and logs the validation error when input is invalid', async () => {
    const schema = z.object({ page: z.coerce.number().min(1) })
    const consoleWarn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    let response: Response | undefined
    try {
      parseOrThrowBadRequest(schema, { page: '0' }, 'Bad pagination')
    } catch (error) {
      response = error as Response
    }

    expect(response?.status).toBe(400)

    const body = await response?.json()
    expect(body).toEqual({
      error: {
        code: 'INVALID_INPUT',
        message: 'Bad pagination',
        issues: [
          {
            code: 'too_small',
            message: 'Too small: expected number to be >=1',
            path: 'page',
          },
        ],
      },
    })
    expect(consoleWarn).toHaveBeenCalledWith('Bad pagination', {
      error: response,
      observability: {
        kind: 'expected',
        level: 'warning',
        shouldReport: false,
      },
      validationError: expect.any(z.ZodError),
    })
    expect(consoleError).not.toHaveBeenCalled()
    expect(shouldReportError(response)).toBe(false)
  })
})

describe('parseOrThrowProviderId', () => {
  it('parses supported provider IDs', () => {
    const result = parseOrThrowProviderId(NASA_IVL_PROVIDER_ID)

    expect(result).toBe(NASA_IVL_PROVIDER_ID)
  })

  it('throws a 400 response with the provider-specific message for invalid IDs', async () => {
    let response: Response | undefined
    try {
      parseOrThrowProviderId('bad-provider')
    } catch (error) {
      response = error as Response
    }

    expect(response?.status).toBe(400)

    const body = await response?.json()
    expect(body).toEqual({
      error: {
        code: 'INVALID_PATH_PARAMS',
        message: 'Invalid providerId',
        issues: [
          {
            code: 'invalid_value',
            message: "Invalid providerId, received 'bad-provider'",
            path: 'providerId',
          },
        ],
      },
    })
  })
})
