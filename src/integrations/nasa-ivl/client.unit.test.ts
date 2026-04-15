import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubFetchJsonOnce } from '../../test/utils/fetch-mock'
import { search } from './client'

const validCollection = {
  collection: {
    version: '1.0',
    href: 'https://images-api.nasa.gov/search?q=apollo',
    items: [
      {
        href: 'https://images-assets.nasa.gov/image/ABC/collection.json',
        data: [
          {
            center: 'JSC',
            date_created: '2021-01-01T00:00:00Z',
            media_type: 'image',
            nasa_id: 'ABC',
            title: 'Apollo',
          },
        ],
        links: [
          {
            href: 'https://images-assets.nasa.gov/image/ABC/thumb.jpg',
            rel: 'preview',
            render: 'image',
          },
        ],
      },
    ],
    metadata: {
      total_hits: 1,
    },
  },
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('nasa-ivl client search', () => {
  it('serializes array params as a comma-separated list', async () => {
    const fetchMock = stubFetchJsonOnce({ json: validCollection })

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
      statusText: 'Bad Request',
      json: { reason: 'Invalid page' },
    })

    await expect(search({ q: 'apollo' })).rejects.toThrow(
      'Error fetching NASA media: Invalid page',
    )
  })
})
