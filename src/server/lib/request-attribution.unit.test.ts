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

  it('omits the referer when the request has none', () => {
    const request = new Request('https://example.com/favorites')

    expect(
      runWithRequestAttribution(request, () => describeCurrentRequest()),
    ).toBe('during GET /favorites')
  })
})
