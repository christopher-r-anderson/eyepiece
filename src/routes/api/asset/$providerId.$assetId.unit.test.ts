import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppException } from '@/lib/result'
import { operationalErrorObservability } from '@/lib/error-observability'
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

const mockService = {
  getAsset: vi.fn(),
  getMetadata: vi.fn(),
  getAlbum: vi.fn(),
  searchAssets: vi.fn(),
}

vi.mock('@/server/eyepiece/service', () => ({
  makeEyepieceProviderService: () => mockService,
}))

// ---------------------------------------------------------------------------
// Import both route configs after mocks are in place.
// ---------------------------------------------------------------------------

const { Route: AssetRoute } = await import('./$providerId.$assetId')
const { Route: MetadataRoute } = await import('./$providerId.$assetId.metadata')
const assetHandler = (AssetRoute as any).server.handlers.GET
const metadataHandler = (MetadataRoute as any).server.handlers.GET

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockAsset = {
  key: { providerId: NASA_IVL_PROVIDER_ID, externalId: 'AS11-40-5931' },
  title: 'Buzz Aldrin on the Moon',
  description: 'Iconic photograph.',
  thumbnail: { href: 'https://example.com/t.jpg', width: 200, height: 150 },
  image: { href: 'https://example.com/i.jpg', width: 1600, height: 1200 },
  original: { href: 'https://example.com/o.tif', width: 4000, height: 3000 },
}

const nasaAsset = {
  key: { providerId: NASA_IVL_PROVIDER_ID, externalId: 'PIA24439' },
  title: 'Apollo Footprint',
  description: 'Buzz Aldrin took this iconic image of a bootprint on the Moon.',
  thumbnail: {
    href: 'https://images-assets.nasa.gov/image/PIA24439/PIA24439~thumb.jpg',
    width: 640,
    height: 626,
  },
  image: {
    href: 'https://images-assets.nasa.gov/image/PIA24439/PIA24439~large.jpg',
    width: 1920,
    height: 1880,
  },
  original: {
    href: 'https://images-assets.nasa.gov/image/PIA24439/PIA24439~orig.jpg',
    width: 3294,
    height: 3226,
  },
}

const sioaAsset = {
  key: {
    providerId: SI_OA_PROVIDER_ID,
    externalId: 'ld1-1643400021979-1643400026497-0',
  },
  title: 'Rocket Engine, Liquid Fuel, Apollo Lunar Module Ascent Engine',
  description: 'Rocket Engine, Liquid Fuel, Apollo Lunar Module Ascent Engine',
  thumbnail: {
    href: 'https://ids.si.edu/ids/download?id=NASM-A19721168000-NASM2018-10153_thumb',
    width: 640,
    height: 480,
  },
  image: {
    href: 'https://ids.si.edu/ids/download?id=NASM-A19721168000-NASM2018-10153_screen',
    width: 640,
    height: 480,
  },
  original: {
    href: 'https://ids.si.edu/ids/download?id=NASM-A19721168000-NASM2018-10153.jpg',
    width: 5760,
    height: 3840,
  },
  mediaType: 'image',
}

const mockMetadata = { photographer: 'Neil Armstrong', date: '1969-07-20' }

const nasaMetadata = {
  'AVAIL:NASAID': 'PIA24439',
  'AVAIL:Title': 'Apollo Footprint',
  'AVAIL:Description':
    'Buzz Aldrin took this iconic image of a bootprint on the Moon during the Apollo 11 moonwalk on July 20, 1969.',
}

// ---------------------------------------------------------------------------
// GET /api/asset/:providerId/:assetId
// ---------------------------------------------------------------------------

describe('GET /api/asset/:providerId/:assetId handler', () => {
  beforeEach(() => {
    mockService.getAsset.mockReset()
    mockService.getAsset.mockResolvedValue(mockAsset)
  })

  it('calls getAsset with the parsed asset key', async () => {
    await assetHandler({
      params: { providerId: NASA_IVL_PROVIDER_ID, assetId: 'AS11-40-5931' },
    })

    expect(mockService.getAsset).toHaveBeenCalledWith({
      providerId: NASA_IVL_PROVIDER_ID,
      externalId: 'AS11-40-5931',
    })
  })

  it('returns a JSON response with the asset', async () => {
    const response = await assetHandler({
      params: { providerId: NASA_IVL_PROVIDER_ID, assetId: 'AS11-40-5931' },
    })

    const body = await response.json()
    expect(body).toEqual(mockAsset)
  })

  it('returns provider-specific NASA asset detail JSON', async () => {
    mockService.getAsset.mockResolvedValue(nasaAsset)

    const response = await assetHandler({
      params: { providerId: NASA_IVL_PROVIDER_ID, assetId: 'PIA24439' },
    })

    const body = await response.json()

    expect(mockService.getAsset).toHaveBeenCalledWith({
      providerId: NASA_IVL_PROVIDER_ID,
      externalId: 'PIA24439',
    })
    expect(body).toEqual(nasaAsset)
  })

  it('works with the SI-OA provider', async () => {
    await assetHandler({
      params: { providerId: SI_OA_PROVIDER_ID, assetId: 'sioa-image-42' },
    })

    expect(mockService.getAsset).toHaveBeenCalledWith({
      providerId: SI_OA_PROVIDER_ID,
      externalId: 'sioa-image-42',
    })
  })

  it('returns provider-specific Smithsonian asset detail JSON', async () => {
    mockService.getAsset.mockResolvedValue(sioaAsset)

    const response = await assetHandler({
      params: {
        providerId: SI_OA_PROVIDER_ID,
        assetId: 'ld1-1643400021979-1643400026497-0',
      },
    })

    const body = await response.json()

    expect(mockService.getAsset).toHaveBeenCalledWith({
      providerId: SI_OA_PROVIDER_ID,
      externalId: 'ld1-1643400021979-1643400026497-0',
    })
    expect(body).toEqual(sioaAsset)
  })

  it('returns a 404 JSON response when the asset does not exist', async () => {
    mockService.getAsset.mockResolvedValue(null)

    const response = await assetHandler({
      params: { providerId: NASA_IVL_PROVIDER_ID, assetId: 'missing-asset' },
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Asset does not exist',
      },
    })
  })

  it('throws a 400 response for an unrecognized providerId', async () => {
    let response: Response | undefined

    try {
      await assetHandler({
        params: { providerId: 'bad_provider', assetId: 'AS11-40-5931' },
      })
    } catch (error) {
      response = error as Response
    }

    expect(response?.status).toBe(400)
    await expect(response?.json()).resolves.toEqual({
      error: {
        code: 'INVALID_PATH_PARAMS',
        message: 'Invalid providerId',
        issues: [
          {
            code: 'invalid_value',
            message: "Invalid providerId, received 'bad_provider'",
            path: 'providerId',
          },
        ],
      },
    })
  })

  it('rethrows handled provider failures with route context', async () => {
    mockService.getAsset.mockRejectedValue(
      new AppException({
        message: 'Provider failed',
        observability: operationalErrorObservability({
          tags: {
            feature: 'providers',
            operation: 'asset.fetch',
            'provider.id': NASA_IVL_PROVIDER_ID,
          },
        }),
      }),
    )

    await expect(
      assetHandler({
        params: { providerId: NASA_IVL_PROVIDER_ID, assetId: 'AS11-40-5931' },
      }),
    ).rejects.toMatchObject({
      appError: {
        observability: {
          tags: {
            feature: 'providers',
            operation: 'asset.fetch',
            'provider.id': NASA_IVL_PROVIDER_ID,
            'api.route': '/api/asset/$providerId/$assetId',
            'http.method': 'GET',
          },
        },
      },
    })
  })
})

// ---------------------------------------------------------------------------
// GET /api/asset/:providerId/:assetId/metadata
// ---------------------------------------------------------------------------

describe('GET /api/asset/:providerId/:assetId/metadata handler', () => {
  beforeEach(() => {
    mockService.getMetadata.mockReset()
    mockService.getMetadata.mockResolvedValue(mockMetadata)
  })

  it('calls getMetadata with the parsed asset key', async () => {
    await metadataHandler({
      params: { providerId: NASA_IVL_PROVIDER_ID, assetId: 'AS11-40-5931' },
    })

    expect(mockService.getMetadata).toHaveBeenCalledWith({
      providerId: NASA_IVL_PROVIDER_ID,
      externalId: 'AS11-40-5931',
    })
  })

  it('returns a JSON response with the metadata', async () => {
    const response = await metadataHandler({
      params: { providerId: NASA_IVL_PROVIDER_ID, assetId: 'AS11-40-5931' },
    })

    const body = await response.json()
    expect(body).toEqual(mockMetadata)
  })

  it('returns provider-specific NASA metadata JSON', async () => {
    mockService.getMetadata.mockResolvedValue(nasaMetadata)

    const response = await metadataHandler({
      params: { providerId: NASA_IVL_PROVIDER_ID, assetId: 'PIA24439' },
    })

    const body = await response.json()

    expect(mockService.getMetadata).toHaveBeenCalledWith({
      providerId: NASA_IVL_PROVIDER_ID,
      externalId: 'PIA24439',
    })
    expect(body).toEqual(nasaMetadata)
  })

  it('returns a 404 JSON response when metadata does not exist', async () => {
    mockService.getMetadata.mockResolvedValue(null)

    const response = await metadataHandler({
      params: { providerId: NASA_IVL_PROVIDER_ID, assetId: 'missing-asset' },
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Asset metadata does not exist',
      },
    })
  })

  it('returns an empty metadata object when the provider has no metadata capability', async () => {
    mockService.getMetadata.mockResolvedValue({})

    const response = await metadataHandler({
      params: { providerId: SI_OA_PROVIDER_ID, assetId: 'sioa-image-42' },
    })

    const body = await response.json()
    expect(body).toEqual({})
  })

  it('returns provider-specific Smithsonian metadata JSON as an empty object', async () => {
    mockService.getMetadata.mockResolvedValue({})

    const response = await metadataHandler({
      params: {
        providerId: SI_OA_PROVIDER_ID,
        assetId: 'ld1-1643400021979-1643400026497-0',
      },
    })

    const body = await response.json()

    expect(mockService.getMetadata).toHaveBeenCalledWith({
      providerId: SI_OA_PROVIDER_ID,
      externalId: 'ld1-1643400021979-1643400026497-0',
    })
    expect(body).toEqual({})
  })

  it('throws a 400 response for an unrecognized providerId', async () => {
    let response: Response | undefined

    try {
      await metadataHandler({
        params: { providerId: 'bad_provider', assetId: 'any-id' },
      })
    } catch (error) {
      response = error as Response
    }

    expect(response?.status).toBe(400)
    await expect(response?.json()).resolves.toEqual({
      error: {
        code: 'INVALID_PATH_PARAMS',
        message: 'Invalid providerId',
        issues: [
          {
            code: 'invalid_value',
            message: "Invalid providerId, received 'bad_provider'",
            path: 'providerId',
          },
        ],
      },
    })
  })
})
