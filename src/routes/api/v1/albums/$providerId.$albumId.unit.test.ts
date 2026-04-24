import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppException } from '@/lib/result'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
  isRedirect: () => false,
  isNotFound: () => false,
  notFound: vi.fn(),
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

async function expectBadRequest(
  request: Promise<unknown>,
  expectedBody: unknown,
) {
  await expect(request).rejects.toMatchObject({ status: 400 })

  try {
    await request
  } catch (error) {
    const response = error as Response

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual(expectedBody)
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/v1/albums/:providerId/:albumId handler', () => {
  beforeEach(() => {
    mockService.getAlbum.mockReset()
    mockService.getAlbum.mockResolvedValue(firstPage)
  })

  it('returns a 501 JSON response when the provider does not support albums', async () => {
    mockService.getAlbum.mockRejectedValue(
      new AppException({
        code: 'UNSUPPORTED_PROVIDER_OPERATION',
        message: 'album.fetch is not supported for provider si_oa',
      }),
    )

    const response = await handler({
      params: { providerId: SI_OA_PROVIDER_ID, albumId: 'some-album' },
      context: makeContext(),
    })

    expect(response.status).toBe(501)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'UNSUPPORTED_PROVIDER_OPERATION',
        message: 'Album lookup is not supported for this provider',
      },
    })
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

  it('returns the route-specific 400 response for invalid album IDs', async () => {
    await expectBadRequest(
      handler({
        params: { providerId: NASA_IVL_PROVIDER_ID, albumId: '' },
        context: makeContext(),
      }),
      {
        error: {
          code: 'INVALID_PATH_PARAMS',
          message: 'Invalid albumId',
          issues: [
            {
              code: 'too_small',
              message: 'Too small: expected string to have >=1 characters',
              path: 'albumId',
            },
          ],
        },
      },
    )
  })

  it('returns a 400 response when the provider ID is invalid', async () => {
    await expectBadRequest(
      handler({
        params: { providerId: 'bad-provider', albumId: 'STS-107' },
        context: makeContext(),
      }),
      {
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
      },
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
    expect(body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Album does not exist',
      },
    })
  })

  it('forwards the pagination parameters for providers with album support', async () => {
    mockService.getAlbum.mockResolvedValue(emptyPage)

    await handler({
      params: { providerId: NASA_IVL_PROVIDER_ID, albumId: 'some-album' },
      context: makeContext({ page: 3, pageSize: 12 }),
    })

    expect(mockService.getAlbum).toHaveBeenCalledWith(expect.anything(), {
      page: 3,
      pageSize: 12,
    })
  })
})
