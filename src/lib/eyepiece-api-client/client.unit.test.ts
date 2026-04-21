import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEyepieceClient } from './client'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { stubFetchJsonOnce } from '@/test/utils/fetch-mock'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createEyepieceClient', () => {
  it('uses structured server error messages for asset 404s when statusText is empty', async () => {
    const client = createEyepieceClient({ origin: 'https://example.com' })
    stubFetchJsonOnce({
      ok: false,
      status: 404,
      statusText: '',
      json: {
        error: {
          code: 'NOT_FOUND',
          message: 'Asset does not exist',
        },
      },
    })

    await expect(
      client.getAsset({
        providerId: NASA_IVL_PROVIDER_ID,
        externalId: 'missing',
      }),
    ).rejects.toThrow('Error fetching asset: Asset does not exist')
  })

  it('uses structured server error messages for album 404s', async () => {
    const client = createEyepieceClient({ origin: 'https://example.com' })
    stubFetchJsonOnce({
      ok: false,
      status: 404,
      statusText: '',
      json: {
        error: {
          code: 'NOT_FOUND',
          message: 'Album does not exist',
        },
      },
    })

    await expect(
      client.getAlbum(
        { providerId: NASA_IVL_PROVIDER_ID, externalId: 'missing' },
        { page: 1, pageSize: 24 },
      ),
    ).rejects.toThrow('Error fetching album: Album does not exist')
  })

  it('falls back to a status-based message when the error response is not structured JSON', async () => {
    const client = createEyepieceClient({ origin: 'https://example.com' })
    stubFetchJsonOnce({
      ok: false,
      status: 500,
      statusText: '',
      json: 'not-structured',
    })

    await expect(
      client.getMetadata({
        providerId: NASA_IVL_PROVIDER_ID,
        externalId: 'broken',
      }),
    ).rejects.toThrow(
      'Error fetching asset metadata: Request failed with status 500',
    )
  })

  it('uses structured server error messages for search failures when statusText is empty', async () => {
    const client = createEyepieceClient({ origin: 'https://example.com' })
    stubFetchJsonOnce({
      ok: false,
      status: 404,
      statusText: '',
      json: {
        error: {
          code: 'NOT_FOUND',
          message: 'Search provider does not exist',
        },
      },
    })

    await expect(
      client.searchAssets(
        'apollo',
        {
          providerId: NASA_IVL_PROVIDER_ID,
          filters: {},
        },
        { page: 1, pageSize: 24 },
      ),
    ).rejects.toThrow('Error searching assets: Search provider does not exist')
  })
})
