import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getApiKey, makeSiOaAdapter } from './si-oa.provider'
import type { SioaAssetItem } from '@/integrations/si-oa/types'
import { SI_OA_PROVIDER_ID } from '@/domain/provider/provider.schema'
import contentFixture from '@/integrations/si-oa/__fixtures__/content.ld1-1643400021979-1643400026497-0.json'
import searchFixture from '@/integrations/si-oa/__fixtures__/search.q.apollo.json'

const { mockGetContent, mockSearch } = vi.hoisted(() => {
  return {
    mockGetContent: vi.fn(),
    mockSearch: vi.fn(),
  }
})

vi.mock('@/integrations/si-oa/client', () => ({
  getContent: mockGetContent,
  search: mockSearch,
}))

describe('getApiKey', () => {
  const originalEnv = process.env.SI_OA_API_KEY

  beforeEach(() => {
    delete process.env.SI_OA_API_KEY
  })

  afterEach(() => {
    if (originalEnv) {
      process.env.SI_OA_API_KEY = originalEnv
    } else {
      delete process.env.SI_OA_API_KEY
    }
  })

  it('returns the API key from environment variable', () => {
    process.env.SI_OA_API_KEY = 'test-key-12345'

    const apiKey = getApiKey()

    expect(apiKey).toBe('test-key-12345')
  })

  it('throws error when SI_OA_API_KEY is not set', () => {
    expect(() => getApiKey()).toThrowError(
      'SI_OA API key is required. Please set the SI_OA_API_KEY environment variable.',
    )
  })

  it('throws error when SI_OA_API_KEY is empty string', () => {
    process.env.SI_OA_API_KEY = ''

    expect(() => getApiKey()).toThrowError(
      'SI_OA API key is required. Please set the SI_OA_API_KEY environment variable.',
    )
  })
})

describe('makeSiOaAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createMockAssetItem(
    overrides: Partial<SioaAssetItem> = {},
  ): SioaAssetItem {
    return {
      id: 'asset-123',
      title: 'Space Object',
      unitCode: 'NASM',
      type: 'object',
      url: 'nasm.si.edu/asset-123',
      hash: 'abc123',
      docSignature: 'sig123',
      content: {
        descriptiveNonRepeating: {
          guid: 'guid-123',
          title: { label: 'Title', content: 'Space Object' },
          record_ID: 'rec-123',
          unit_code: 'NASM',
          data_source: 'National Air and Space Museum',
          metadata_usage: {
            access: 'CC0',
          },
        },
      },
      ...overrides,
    }
  }

  it('returns adapter with correct provider ID', () => {
    const adapter = makeSiOaAdapter('test-key')

    expect(adapter.getProviderId()).toBe(SI_OA_PROVIDER_ID)
  })

  it('returns adapter with search filters schema', () => {
    const adapter = makeSiOaAdapter('test-key')

    const schema = adapter.getSearchFiltersSchema()
    expect(schema).toBeDefined()
  })

  describe('getAsset', () => {
    it('maps fixture-backed content responses', async () => {
      mockGetContent.mockResolvedValue(contentFixture)

      const adapter = makeSiOaAdapter('test-key')
      const result = await adapter.getAsset(contentFixture.response.id)

      expect(mockGetContent).toHaveBeenCalledWith(
        contentFixture.response.id,
        'test-key',
      )
      expect(result).not.toBeNull()
      expect(result?.title).toBe(
        'Rocket Engine, Liquid Fuel, Apollo Lunar Module Ascent Engine',
      )
      expect(result?.key.externalId).toBe(contentFixture.response.id)
      expect(result?.key.providerId).toBe(SI_OA_PROVIDER_ID)
      expect(result?.original.href).toContain(
        'NASM-A19721168000-NASM2018-10153.jpg',
      )
      expect(result?.image.href).toContain(
        'NASM-A19721168000-NASM2018-10153_screen',
      )
      expect(result?.thumbnail.href).toContain(
        'NASM-A19721168000-NASM2018-10153_thumb',
      )
    })

    it('fetches asset by ID and maps response', async () => {
      const mockAssetItem = createMockAssetItem()
      const mockResponse = {
        status: 200,
        responseCode: 200,
        response: mockAssetItem,
      }

      mockGetContent.mockResolvedValue(mockResponse)

      const adapter = makeSiOaAdapter('test-key')
      const result = await adapter.getAsset('asset-123')

      expect(mockGetContent).toHaveBeenCalledWith('asset-123', 'test-key')
      expect(result).toHaveProperty('title', 'Space Object')
      expect(result).toHaveProperty('key')
      expect(result?.key.externalId).toBe('asset-123')
      expect(result?.key.providerId).toBe(SI_OA_PROVIDER_ID)
    })

    it('propagates getContent errors', async () => {
      const error = new Error('API Error')
      mockGetContent.mockRejectedValue(error)

      const adapter = makeSiOaAdapter('test-key')

      await expect(adapter.getAsset('asset-123')).rejects.toThrow('API Error')
    })
  })

  describe('searchAssets', () => {
    it('maps fixture-backed search responses', async () => {
      mockSearch.mockResolvedValue(searchFixture)

      const adapter = makeSiOaAdapter('test-key')
      const result = await adapter.searchAssets(
        'apollo',
        {},
        { page: 1, pageSize: 24 },
      )

      expect(result.items).toHaveLength(searchFixture.response.rows.length)
      expect(result.items[0]?.title).toBe(
        'Command and Service Modules, Apollo #105, ASTP Mockup',
      )
      expect(result.items[0]?.key.externalId).toBe(
        searchFixture.response.rows[0]?.id,
      )
      expect(result.items[0]?.original.href).toContain(
        'NASM-A19740798000-NASM2018-10165.jpg',
      )
      expect(result.items[0]?.image.href).toContain(
        'NASM-A19740798000-NASM2018-10165_screen',
      )
      expect(result.items[0]?.thumbnail.href).toContain(
        'NASM-A19740798000-NASM2018-10165_thumb',
      )
      expect(result.pagination.total).toBe(searchFixture.response.rowCount)
      expect(result.pagination.next).toBe(2)
    })

    it('searches assets and maps paginated response', async () => {
      const mockAsset1 = createMockAssetItem({ id: 'asset-1', title: 'First' })
      const mockAsset2 = createMockAssetItem({ id: 'asset-2', title: 'Second' })

      const mockResponse = {
        status: 200,
        responseCode: 200,
        response: {
          rowCount: 50,
          rows: [mockAsset1, mockAsset2],
          facets: {},
          message: 'ok',
        },
      }

      mockSearch.mockResolvedValue(mockResponse)

      const adapter = makeSiOaAdapter('test-key')
      const result = await adapter.searchAssets(
        'apollo',
        {},
        { page: 1, pageSize: 20 },
      )

      expect(mockSearch).toHaveBeenCalledWith(
        {
          q: 'apollo AND online_media_type:Images AND data_source:"National Air and Space Museum"',
          start: 0,
          rows: 20,
        },
        'test-key',
      )
      expect(result.items).toHaveLength(2)
      expect(result.items[0]).toHaveProperty('title', 'First')
      expect(result.items[1]).toHaveProperty('title', 'Second')
    })

    it('calculates next page from total and current items', async () => {
      const mockAsset1 = createMockAssetItem({ id: 'asset-1' })
      const mockAsset2 = createMockAssetItem({ id: 'asset-2' })

      const mockResponse = {
        status: 200,
        responseCode: 200,
        response: {
          rowCount: 100,
          rows: [mockAsset1, mockAsset2],
          facets: {},
          message: 'ok',
        },
      }

      mockSearch.mockResolvedValue(mockResponse)

      const adapter = makeSiOaAdapter('test-key')
      const result = await adapter.searchAssets(
        'apollo',
        {},
        { page: 1, pageSize: 20 },
      )

      expect(result.pagination.next).toBe(2)
      expect(result.pagination.total).toBe(100)
    })

    it('returns null for next page when at end of results', async () => {
      const mockAsset1 = createMockAssetItem({ id: 'asset-1' })

      const mockResponse = {
        status: 200,
        responseCode: 200,
        response: {
          rowCount: 21,
          rows: [mockAsset1],
          facets: {},
          message: 'ok',
        },
      }

      mockSearch.mockResolvedValue(mockResponse)

      const adapter = makeSiOaAdapter('test-key')
      const result = await adapter.searchAssets(
        'apollo',
        {},
        { page: 2, pageSize: 20 },
      )

      expect(result.pagination.next).toBeNull()
      expect(result.pagination.total).toBe(21)
    })

    it('handles empty search results', async () => {
      const mockResponse = {
        status: 200,
        responseCode: 200,
        response: {
          rowCount: 0,
          rows: [],
          facets: {},
          message: 'ok',
        },
      }

      mockSearch.mockResolvedValue(mockResponse)

      const adapter = makeSiOaAdapter('test-key')
      const result = await adapter.searchAssets(
        'nonexistent',
        {},
        { page: 1, pageSize: 20 },
      )

      expect(result.items).toHaveLength(0)
      expect(result.pagination.next).toBeNull()
      expect(result.pagination.total).toBe(0)
    })

    it('propagates search errors', async () => {
      const error = new Error('Search failed')
      mockSearch.mockRejectedValue(error)

      const adapter = makeSiOaAdapter('test-key')

      await expect(
        adapter.searchAssets('apollo', {}, { page: 1, pageSize: 20 }),
      ).rejects.toThrow('Search failed')
    })

    it('passes through pagination parameters correctly', async () => {
      const mockResponse = {
        status: 200,
        responseCode: 200,
        response: {
          rowCount: 200,
          rows: [createMockAssetItem()],
          facets: {},
          message: 'ok',
        },
      }

      mockSearch.mockResolvedValue(mockResponse)

      const adapter = makeSiOaAdapter('test-key')
      await adapter.searchAssets('query', {}, { page: 5, pageSize: 50 })

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          start: 200, // (5-1) * 50
          rows: 50,
        }),
        'test-key',
      )
    })
  })
})
