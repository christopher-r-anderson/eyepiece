import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubFetchJsonOnce } from '../../test/utils/fetch-mock'
import { getAlbum, getMetadata, search } from './client'
import albumFixture from './__fixtures__/album.Apollo-at-50.json'
import invalidAlbumErrorFixture from './__fixtures__/album.invalid-album.error.json'
import metadataFixture from './__fixtures__/metadata.PIA24439.json'
import assetSearchFixture from './__fixtures__/search.nasa-id.PIA24439.json'
import querySearchFixture from './__fixtures__/search.q.apollo.json'
import { ProviderClientError } from '@/integrations/provider-client-error'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('nasa-ivl client search', () => {
  it('parses real q-search fixture responses', async () => {
    stubFetchJsonOnce({ json: querySearchFixture })

    const parsed = await search({ q: 'apollo' })
    const footprint = parsed.collection.items.find(
      (item) => item.data[0]?.nasa_id === 'PIA24439',
    )

    expect(parsed.collection.metadata.total_hits).toBe(
      querySearchFixture.collection.metadata.total_hits,
    )
    expect(parsed.collection.items).toHaveLength(
      querySearchFixture.collection.items.length,
    )
    expect(footprint).toBeDefined()
    expect(footprint?.data[0]?.title).toBe('Apollo Footprint')
  })

  it('parses real nasa_id search fixture responses', async () => {
    stubFetchJsonOnce({ json: assetSearchFixture })

    const parsed = await search({ nasa_id: 'PIA24439' })

    expect(parsed.collection.metadata.total_hits).toBe(1)
    expect(parsed.collection.items).toHaveLength(1)
    expect(parsed.collection.items[0].data[0].nasa_id).toBe('PIA24439')
    expect(parsed.collection.items[0].data[0].title).toBe('Apollo Footprint')
  })

  it('serializes array params as a comma-separated list', async () => {
    const fetchMock = stubFetchJsonOnce({ json: querySearchFixture })

    await search({ q: 'apollo', media_type: ['image', 'video'] })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const requestUrl = fetchMock.mock.calls[0][0] as string
    expect(requestUrl).toContain('/search')
    expect(requestUrl).toContain('q=apollo')
    expect(requestUrl).toContain('media_type=image%2Cvideo')
  })

  it('uses API reason details in thrown errors', async () => {
    stubFetchJsonOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: { reason: 'Invalid page' },
    })

    const request = search({ q: 'apollo' })

    await expect(request).rejects.toMatchObject({
      name: 'ProviderClientError',
      status: 400,
    })
    await expect(request).rejects.toThrow(
      'Error fetching NASA media: Invalid page',
    )
  })

  it('falls back to status text when the search error payload has no reason', async () => {
    stubFetchJsonOnce({
      ok: false,
      statusText: 'Service Unavailable',
      json: {},
    })

    await expect(search({ q: 'apollo' })).rejects.toThrow(
      'Error fetching NASA media: Service Unavailable',
    )
  })

  it('parses real album fixture responses', async () => {
    stubFetchJsonOnce({ json: albumFixture })

    const parsed = await getAlbum('Apollo-at-50', { page: 1 })

    expect(parsed.collection.metadata.total_hits).toBe(
      albumFixture.collection.metadata.total_hits,
    )
    expect(parsed.collection.items).toHaveLength(
      albumFixture.collection.items.length,
    )
    expect(parsed.collection.items[0].data[0].album).toContain('Apollo-at-50')
  })

  it('uses API reason details in album errors', async () => {
    stubFetchJsonOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: invalidAlbumErrorFixture,
    })

    const request = getAlbum('invalid-album', { page: 1 })

    await expect(request).rejects.toThrow(
      `Error fetching NASA media: ${invalidAlbumErrorFixture.reason}`,
    )
    await expect(request).rejects.toMatchObject({
      name: 'ProviderClientError',
      status: 400,
      kind: 'not_found',
      operation: 'album.fetch',
    })
  })

  it('parses fixture-backed metadata responses', async () => {
    stubFetchJsonOnce({ json: metadataFixture })

    const parsed = await getMetadata('PIA24439')

    expect(parsed['AVAIL:NASAID']).toBe('PIA24439')
    expect(parsed['AVAIL:Title']).toBe('Apollo Footprint')
  })

  it('falls back to status text when metadata errors omit a reason', async () => {
    stubFetchJsonOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: {},
    })

    await expect(getMetadata('PIA24439')).rejects.toThrow(
      'Error fetching NASA asset metadata: Forbidden',
    )
  })

  it('throws structured provider client errors for metadata failures', async () => {
    stubFetchJsonOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: { reason: 'Missing metadata' },
    })

    const request = getMetadata('missing')

    await expect(request).rejects.toBeInstanceOf(ProviderClientError)
    await expect(request).rejects.toMatchObject({
      operation: 'metadata.fetch',
      status: 404,
    })
  })
})
