import { describe, expect, it } from 'vitest'
import {
  cloneHeadersPreservingSetCookie,
  setResponseHeadersSafely,
} from './response-headers'

describe('setResponseHeadersSafely', () => {
  it('sets and deletes headers in place on mutable responses', () => {
    const response = new Response(null, {
      status: 200,
      headers: {
        'cache-control': 'public, max-age=300',
        'netlify-cdn-cache-control': 'public, s-maxage=300',
      },
    })

    const result = setResponseHeadersSafely(response, {
      'cache-control': 'private, no-store',
      'netlify-cdn-cache-control': null,
    })

    expect(result).toBe(response)
    expect(result.headers.get('cache-control')).toBe('private, no-store')
    expect(result.headers.get('netlify-cdn-cache-control')).toBeNull()
  })

  it('rebuilds the response when headers are immutable', () => {
    const response = new Response(null, {
      status: 303,
      headers: { location: '/login' },
    })
    // Simulate runtimes that freeze redirect/error response headers.
    response.headers.set = () => {
      throw new TypeError('immutable')
    }

    const result = setResponseHeadersSafely(response, {
      'cache-control': 'private, no-store',
    })

    expect(result).not.toBe(response)
    expect(result.status).toBe(303)
    expect(result.headers.get('location')).toBe('/login')
    expect(result.headers.get('cache-control')).toBe('private, no-store')
  })

  it('preserves multiple set-cookie values when rebuilding', () => {
    const response = new Response(null, { status: 303 })
    response.headers.append('set-cookie', 'sb-access-token=abc; Path=/')
    response.headers.append('set-cookie', 'sb-refresh-token=def; Path=/')
    response.headers.set = () => {
      throw new TypeError('immutable')
    }

    const result = setResponseHeadersSafely(response, {
      'cache-control': 'private, no-store',
    })

    expect(result.headers.getSetCookie()).toEqual([
      'sb-access-token=abc; Path=/',
      'sb-refresh-token=def; Path=/',
    ])
  })
})

describe('cloneHeadersPreservingSetCookie', () => {
  it('keeps distinct set-cookie entries distinct', () => {
    const headers = new Headers()
    headers.append('set-cookie', 'a=1; Path=/')
    headers.append('set-cookie', 'b=2; Path=/')

    const cloned = cloneHeadersPreservingSetCookie(headers)

    expect(cloned.getSetCookie()).toEqual(['a=1; Path=/', 'b=2; Path=/'])
  })
})
