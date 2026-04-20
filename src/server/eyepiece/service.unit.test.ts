import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as Sentry from '@sentry/tanstackstart-react'
import { makeEyepieceProviderService } from './service'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'
import { ProviderClientError } from '@/integrations/provider-client-error'

const pagination = { page: 2, pageSize: 10 }

const { nasaProvider, siOaProvider } = vi.hoisted(() => ({
  nasaProvider: {
    getProviderId: () => 'nasa_ivl',
    capabilities: { albums: true, metadata: true },
    getSearchFiltersSchema: vi.fn(),
    getAlbum: vi.fn(),
    getAsset: vi.fn(),
    getMetadata: vi.fn(),
    searchAssets: vi.fn(),
  },
  siOaProvider: {
    getProviderId: () => 'si_oa',
    capabilities: {},
    getSearchFiltersSchema: vi.fn(),
    getAsset: vi.fn(),
    searchAssets: vi.fn(),
  },
}))

vi.mock('./providers/nasa-ivl/nasa-ivl.provider', () => ({
  makeNasaIvlAdapter: () => nasaProvider,
}))

vi.mock('./providers/si-oa/si-oa.provider', () => ({
  getApiKey: () => 'test-api-key',
  makeSiOaAdapter: () => siOaProvider,
}))

const { mockSpan } = vi.hoisted(() => ({
  mockSpan: {
    setAttribute: vi.fn(),
  },
}))

vi.mock('@sentry/tanstackstart-react', () => ({
  startSpan: vi.fn(
    (
      _options: unknown,
      callback: (span: { setAttribute: ReturnType<typeof vi.fn> }) => unknown,
    ) => callback(mockSpan),
  ),
}))

const mockStartSpan = vi.mocked(Sentry.startSpan)

describe('makeEyepieceProviderService', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    nasaProvider.getAlbum.mockReset()
    nasaProvider.getAsset.mockReset()
    nasaProvider.getMetadata.mockReset()
    nasaProvider.searchAssets.mockReset()
    siOaProvider.getAsset.mockReset()
    siOaProvider.searchAssets.mockReset()
  })

  it('delegates getAlbum to providers that support albums', async () => {
    const expected = { items: [], pagination: { next: null, total: 0 } }
    nasaProvider.getAlbum.mockResolvedValue(expected)
    const service = makeEyepieceProviderService()

    const result = await service.getAlbum(
      { providerId: NASA_IVL_PROVIDER_ID, externalId: 'album-1' },
      pagination,
    )

    expect(nasaProvider.getAlbum).toHaveBeenCalledWith('album-1', pagination)
    expect(result).toEqual(expected)
  })

  it('throws for getAlbum when the provider has no album capability', async () => {
    const service = makeEyepieceProviderService()

    await expect(
      service.getAlbum(
        { providerId: SI_OA_PROVIDER_ID, externalId: 'album-1' },
        pagination,
      ),
    ).rejects.toMatchObject({
      appError: {
        code: 'UNSUPPORTED_PROVIDER_OPERATION',
      },
    })
  })

  it('delegates getAsset to the provider selected by asset key', async () => {
    const expected = {
      key: { providerId: SI_OA_PROVIDER_ID, externalId: 'a1' },
    }
    siOaProvider.getAsset.mockResolvedValue(expected)
    const service = makeEyepieceProviderService()

    const result = await service.getAsset({
      providerId: SI_OA_PROVIDER_ID,
      externalId: 'a1',
    })

    expect(siOaProvider.getAsset).toHaveBeenCalledWith('a1')
    expect(result).toEqual(expected)
  })

  it('delegates getMetadata when the provider supports metadata', async () => {
    const expected = { photographer: 'NASA' }
    nasaProvider.getMetadata.mockResolvedValue(expected)
    const service = makeEyepieceProviderService()

    const result = await service.getMetadata({
      providerId: NASA_IVL_PROVIDER_ID,
      externalId: 'asset-1',
    })

    expect(nasaProvider.getMetadata).toHaveBeenCalledWith('asset-1')
    expect(result).toEqual(expected)
  })

  it('throws for getMetadata when the provider has no metadata capability', async () => {
    const service = makeEyepieceProviderService()

    await expect(
      service.getMetadata({
        providerId: SI_OA_PROVIDER_ID,
        externalId: 'asset-1',
      }),
    ).rejects.toMatchObject({
      appError: {
        code: 'UNSUPPORTED_PROVIDER_OPERATION',
      },
    })
  })

  it('returns null for getAsset when the provider reports a 404', async () => {
    siOaProvider.getAsset.mockRejectedValue(
      new ProviderClientError({
        providerId: SI_OA_PROVIDER_ID,
        operation: 'asset.fetch',
        status: 404,
        url: 'https://example.com/content/missing',
        message: 'missing',
      }),
    )
    const service = makeEyepieceProviderService()

    const result = await service.getAsset({
      providerId: SI_OA_PROVIDER_ID,
      externalId: 'missing',
    })

    expect(result).toBeNull()
  })

  it('returns null for getAlbum when the provider reports a semantic not found', async () => {
    nasaProvider.getAlbum.mockRejectedValue(
      new ProviderClientError({
        providerId: NASA_IVL_PROVIDER_ID,
        operation: 'album.fetch',
        status: 400,
        kind: 'not_found',
        url: 'https://images-api.nasa.gov/album/missing?page=1',
        message: 'No assets found for album="missing" page=1',
      }),
    )
    const service = makeEyepieceProviderService()

    const result = await service.getAlbum(
      { providerId: NASA_IVL_PROVIDER_ID, externalId: 'missing' },
      pagination,
    )

    expect(result).toBeNull()
  })

  it('wraps provider failures with structured observability metadata', async () => {
    siOaProvider.getAsset.mockRejectedValue(
      new ProviderClientError({
        providerId: SI_OA_PROVIDER_ID,
        operation: 'asset.fetch',
        status: 503,
        url: 'https://example.com/content/broken',
        message: 'Service unavailable',
      }),
    )
    const service = makeEyepieceProviderService()

    await expect(
      service.getAsset({
        providerId: SI_OA_PROVIDER_ID,
        externalId: 'broken',
      }),
    ).rejects.toMatchObject({
      appError: {
        code: 'PROVIDER_REQUEST_FAILED',
        observability: {
          tags: {
            feature: 'providers',
            operation: 'asset.fetch',
            'provider.id': SI_OA_PROVIDER_ID,
          },
          context: {
            'asset.externalId': 'broken',
            'provider.request.operation': 'asset.fetch',
            'provider.request.status': 503,
            'provider.request.url': 'https://example.com/content/broken',
          },
        },
      },
    })
    expect(mockSpan.setAttribute).toHaveBeenCalledWith(
      'eyepiece.provider.result',
      'error',
    )
  })

  it('routes NASA search requests with NASA filters', async () => {
    const expected = { items: [], pagination: { next: 2, total: 50 } }
    nasaProvider.searchAssets.mockResolvedValue(expected)
    const service = makeEyepieceProviderService()
    const filters = {
      providerId: NASA_IVL_PROVIDER_ID,
      filters: { mediaType: 'image' as const, yearStart: 2000 },
    }

    const result = await service.searchAssets('apollo', filters, pagination)

    expect(nasaProvider.searchAssets).toHaveBeenCalledWith(
      'apollo',
      filters.filters,
      pagination,
    )
    expect(mockStartSpan).toHaveBeenCalledWith(
      {
        name: 'provider.search.fetch',
        op: 'provider.fetch',
        attributes: {
          'eyepiece.provider.id': NASA_IVL_PROVIDER_ID,
          'eyepiece.provider.operation': 'search.fetch',
          'eyepiece.search.page': pagination.page,
          'eyepiece.search.page_size': pagination.pageSize,
          'eyepiece.search.query_length': 'apollo'.length,
          'eyepiece.search.has_filters': true,
        },
      },
      expect.any(Function),
    )
    expect(mockSpan.setAttribute).toHaveBeenCalledWith(
      'eyepiece.provider.result',
      'success',
    )
    expect(result).toEqual(expected)
  })

  it('routes SI OA search requests with SI OA filters', async () => {
    const expected = { items: [], pagination: { next: null, total: 4 } }
    siOaProvider.searchAssets.mockResolvedValue(expected)
    const service = makeEyepieceProviderService()
    const filters = {
      providerId: SI_OA_PROVIDER_ID,
      filters: {},
    }

    const result = await service.searchAssets('apollo', filters, pagination)

    expect(siOaProvider.searchAssets).toHaveBeenCalledWith(
      'apollo',
      filters.filters,
      pagination,
    )
    expect(result).toEqual(expected)
  })

  it('marks handled provider 404s as not_found spans', async () => {
    siOaProvider.getAsset.mockRejectedValue(
      new ProviderClientError({
        providerId: SI_OA_PROVIDER_ID,
        operation: 'asset.fetch',
        status: 404,
        url: 'https://example.com/content/missing',
        message: 'missing',
      }),
    )
    const service = makeEyepieceProviderService()

    const result = await service.getAsset({
      providerId: SI_OA_PROVIDER_ID,
      externalId: 'missing',
    })

    expect(result).toBeNull()
    expect(mockStartSpan).toHaveBeenCalledWith(
      {
        name: 'provider.asset.fetch',
        op: 'provider.fetch',
        attributes: {
          'eyepiece.provider.id': SI_OA_PROVIDER_ID,
          'eyepiece.provider.operation': 'asset.fetch',
        },
      },
      expect.any(Function),
    )
    expect(mockSpan.setAttribute).toHaveBeenCalledWith(
      'eyepiece.provider.result',
      'not_found',
    )
  })
})
