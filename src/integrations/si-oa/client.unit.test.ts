import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubFetchJsonOnce } from '../../test/utils/fetch-mock'
import { getContent, search } from './client'
import contentFixture from './__fixtures__/content.ld1-1643400021979-1643400026497-0.json'
import searchFixture from './__fixtures__/search.q.apollo.json'
import { ProviderClientError } from '@/integrations/provider-client-error'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('si-oa client', () => {
  it('parses real q-search fixture responses', async () => {
    stubFetchJsonOnce({ json: searchFixture })

    const parsed = await search(
      {
        q: 'apollo AND online_media_type:Images AND data_source:"National Air and Space Museum"',
        start: 0,
        rows: 24,
      },
      'key',
    )

    expect(parsed.response.rowCount).toBe(searchFixture.response.rowCount)
    expect(parsed.response.message).toBe(searchFixture.response.message)
    expect(parsed.response.rows).toHaveLength(
      searchFixture.response.rows.length,
    )
    expect(parsed.response.rows[0]?.id).toBe(searchFixture.response.rows[0]?.id)
    expect(parsed.response.rows[0]?.title).toBe(
      'Command and Service Modules, Apollo #105, ASTP Mockup',
    )
  })

  it('serializes fully built search params into the request URL', async () => {
    const fetchMock = stubFetchJsonOnce({ json: searchFixture })

    await search(
      {
        q: 'apollo AND online_media_type:Images AND data_source:"National Air and Space Museum"',
        start: 0,
        rows: 24,
      },
      'key',
    )

    const requestUrl = fetchMock.mock.calls[0][0] as string
    expect(requestUrl).toContain('/search')
    expect(requestUrl).toContain('q=apollo+AND+online_media_type%3AImages')
    expect(requestUrl).toContain('start=0')
    expect(requestUrl).toContain('rows=24')
  })

  it('redacts api keys in error messages', async () => {
    const apiKey = 'super-secret-api-key'
    stubFetchJsonOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: { message: 'Invalid key' },
    })

    let message = ''
    try {
      await search({ q: 'apollo' }, apiKey)
    } catch (error) {
      message = (error as Error).message
    }

    expect(message).toContain('api_key=REDACTED')
    expect(message).not.toContain(apiKey)
  })

  it('falls back to status text when search errors omit a message', async () => {
    stubFetchJsonOnce({
      ok: false,
      statusText: 'Too Many Requests',
      json: {},
    })

    await expect(search({ q: 'apollo' }, 'key')).rejects.toThrow(
      'Error fetching Smithsonian search: Too Many Requests',
    )
  })

  it('parses getContent responses into the expected schema', async () => {
    stubFetchJsonOnce({
      json: contentFixture,
    })

    const parsed = await getContent(contentFixture.response.id, 'key')

    expect(parsed.response.id).toBe(contentFixture.response.id)
    expect(parsed.response.title).toBe(contentFixture.response.title)
    expect(
      parsed.response.content.descriptiveNonRepeating.online_media?.media[0]
        ?.resources[1]?.label,
    ).toBe('High-resolution JPEG')
  })

  it('redacts api keys in content error messages', async () => {
    const apiKey = 'super-secret-api-key'
    stubFetchJsonOnce({
      ok: false,
      statusText: 'Unauthorized',
      json: { message: 'Invalid key' },
    })

    const request = getContent(contentFixture.response.id, apiKey)

    await expect(request).rejects.toThrow('api_key=REDACTED')
    await expect(request).rejects.not.toThrow(apiKey)
  })

  it('falls back to status text when content errors omit a message', async () => {
    stubFetchJsonOnce({
      ok: false,
      status: 504,
      statusText: 'Gateway Timeout',
      json: {},
    })

    await expect(getContent(contentFixture.response.id, 'key')).rejects.toThrow(
      'Error fetching Smithsonian asset: Gateway Timeout',
    )
  })

  it('throws structured provider client errors for content failures', async () => {
    stubFetchJsonOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: { message: 'Missing record' },
    })

    const request = getContent(contentFixture.response.id, 'key')

    await expect(request).rejects.toBeInstanceOf(ProviderClientError)
    await expect(request).rejects.toMatchObject({
      operation: 'asset.fetch',
      status: 404,
    })
  })
})
