import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
}))

vi.mock('@/server/lib/middleware', () => ({
  buildUrlSearchParamsMiddleware: vi.fn(() => 'middleware-stub'),
}))

const mockService = {
  getAlbum: vi.fn(),
  getAsset: vi.fn(),
  getMetadata: vi.fn(),
  searchAssets: vi.fn(),
}

vi.mock('@/server/eyepiece/service', () => ({
  makeEyepieceProviderService: () => mockService,
}))

// ---------------------------------------------------------------------------
// Import the route configs after mocks are in place.
// ---------------------------------------------------------------------------

const { Route } = await import('./$providerId.$albumId')
const handler = (Route as any).server.handlers.GET

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pagination = { page: 1, pageSize: 24 }

function makeContext(searchParams: Record<string, unknown> = pagination) {
  return { searchParams }
}

const asset = {
  key: { providerId: NASA_IVL_PROVIDER_ID, externalId: 'a1' },
  title: 'Apollo 11 Launch',
  thumbnail: { href: 'https://example.com/t.jpg', width: 200, height: 150 },
}
const emptyPage = { items: [], pagination: { next: null, total: 0 } }
const firstPage = { items: [asset], pagination: { next: null, total: 1 } }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/albums/:providerId/:albumId handler', () => {
  beforeEach(() => {
    mockService.getAlbum.mockReset()
    mockService.getAlbum.mockResolvedValue(firstPage)
  })

  it('calls getAlbum with the parsed asset key and pagination', async () => {
    await handler({
      params: {
        providerId: NASA_IVL_PROVIDER_ID,
        albumId: 'GSFC_MASTERFILE_STS-107',
      },
      context: makeContext(),
    })

    expect(mockService.getAlbum).toHaveBeenCalledWith(
      {
        providerId: NASA_IVL_PROVIDER_ID,
        externalId: 'GSFC_MASTERFILE_STS-107',
      },
      pagination,
    )
  })

  it('returns a 200 JSON response with the album page', async () => {
    const response = await handler({
      params: { providerId: NASA_IVL_PROVIDER_ID, albumId: 'STS-107' },
      context: makeContext(),
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual(firstPage)
  })

  it('returns a 404 JSON response when the service returns null', async () => {
    mockService.getAlbum.mockResolvedValue(null)

    const response = await handler({
      params: { providerId: NASA_IVL_PROVIDER_ID, albumId: 'STS-107' },
      context: makeContext(),
    })

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body).toMatchObject({ message: 'Album does not exist' })
  })

  it('throws a 400 response for an unrecognized providerId', async () => {
    await expect(
      handler({
        params: { providerId: 'not_valid', albumId: 'STS-107' },
        context: makeContext(),
      }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('throws a 400 response when the albumId is empty', async () => {
    await expect(
      handler({
        params: { providerId: NASA_IVL_PROVIDER_ID, albumId: '' },
        context: makeContext(),
      }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('forwards the pagination parameters to the service', async () => {
    mockService.getAlbum.mockResolvedValue(emptyPage)

    await handler({
      params: { providerId: SI_OA_PROVIDER_ID, albumId: 'some-album' },
      context: makeContext({ page: 3, pageSize: 12 }),
    })

    expect(mockService.getAlbum).toHaveBeenCalledWith(expect.anything(), {
      page: 3,
      pageSize: 12,
    })
  })
})
