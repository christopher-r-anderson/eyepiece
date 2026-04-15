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

const mockMetadata = { photographer: 'Neil Armstrong', date: '1969-07-20' }

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

  it('works with the SI-OA provider', async () => {
    await assetHandler({
      params: { providerId: SI_OA_PROVIDER_ID, assetId: 'sioa-image-42' },
    })

    expect(mockService.getAsset).toHaveBeenCalledWith({
      providerId: SI_OA_PROVIDER_ID,
      externalId: 'sioa-image-42',
    })
  })

  it('throws a 400 response for an unrecognized providerId', async () => {
    await expect(
      assetHandler({
        params: { providerId: 'bad_provider', assetId: 'AS11-40-5931' },
      }),
    ).rejects.toMatchObject({ status: 400 })
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

  it('returns a null JSON body when the provider has no metadata capability', async () => {
    mockService.getMetadata.mockResolvedValue(null)

    const response = await metadataHandler({
      params: { providerId: SI_OA_PROVIDER_ID, assetId: 'sioa-image-42' },
    })

    const body = await response.json()
    expect(body).toBeNull()
  })

  it('throws a 400 response for an unrecognized providerId', async () => {
    await expect(
      metadataHandler({
        params: { providerId: 'bad_provider', assetId: 'any-id' },
      }),
    ).rejects.toMatchObject({ status: 400 })
  })
})
