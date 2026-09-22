import { describe, expect, it } from 'vitest'
import {
  describeCurrentRequest,
  runWithRequestAttribution,
} from './request-attribution'

describe('request attribution', () => {
  it('is empty outside a request scope', () => {
    expect(describeCurrentRequest()).toBe('')
  })

  it('names the method, path, query, and referer inside a scope', async () => {
    const request = new Request(
      'https://example.com/api/v1/asset/nasa_ivl/iss034e010322?x=1',
      { headers: { referer: 'https://example.com/favorites' } },
    )

    const described = await runWithRequestAttribution(request, async () => {
      await Promise.resolve()
      return describeCurrentRequest()
    })

    expect(described).toBe(
      'during GET /api/v1/asset/nasa_ivl/iss034e010322?x=1 referer=https://example.com/favorites',
    )
  })

  it('names the user agent and the running spec when the request carries them', () => {
    const request = new Request('https://example.com/api/v1/search?q=moon', {
      headers: {
        referer: 'https://example.com/search?q=moon',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Firefox/140.0',
        'x-e2e-spec': 'search.spec.ts > a year edit applies on blur',
      },
    })

    expect(
      runWithRequestAttribution(request, () => describeCurrentRequest()),
    ).toBe(
      'during GET /api/v1/search?q=moon referer=https://example.com/search?q=moon ua="Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Firefox/140.0" spec="search.spec.ts > a year edit applies on blur"',
    )
  })

  it('omits the referer when the request has none', () => {
    const request = new Request('https://example.com/favorites')

    expect(
      runWithRequestAttribution(request, () => describeCurrentRequest()),
    ).toBe('during GET /favorites')
  })
})
