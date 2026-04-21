import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeNasaIvlAdapter } from './nasa-ivl.provider'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import albumFixture from '@/integrations/nasa-ivl/__fixtures__/album.Apollo-at-50.json'
import invalidAlbumErrorFixture from '@/integrations/nasa-ivl/__fixtures__/album.invalid-album.error.json'
import metadataFixture from '@/integrations/nasa-ivl/__fixtures__/metadata.PIA24439.json'
import assetSearchFixture from '@/integrations/nasa-ivl/__fixtures__/search.nasa-id.PIA24439.json'
import querySearchFixture from '@/integrations/nasa-ivl/__fixtures__/search.q.apollo.json'

const { mockGetAlbum, mockGetMetadata, mockSearch } = vi.hoisted(() => ({
  mockGetAlbum: vi.fn(),
  mockGetMetadata: vi.fn(),
  mockSearch: vi.fn(),
}))

vi.mock('@/integrations/nasa-ivl/client', () => ({
  NASA_ALBUM_PAGE_SIZE: 100,
  getAlbum: mockGetAlbum,
  getMetadata: mockGetMetadata,
  search: mockSearch,
}))

describe('makeNasaIvlAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns adapter with correct provider ID', () => {
    const adapter = makeNasaIvlAdapter()

    expect(adapter.getProviderId()).toBe(NASA_IVL_PROVIDER_ID)
  })

  it('maps real q-search fixture responses into Eyepiece assets', async () => {
    mockSearch.mockResolvedValue(querySearchFixture)

    const adapter = makeNasaIvlAdapter()
    const result = await adapter.searchAssets(
      'apollo',
      {},
      { page: 1, pageSize: 20 },
    )
    const footprint = result.items.find(
      (item) => item.key.externalId === 'PIA24439',
    )
    const albumLogo = result.items.find(
      (item) => item.key.externalId === 'APOLLO 50th_FULL COLOR_300DPI',
    )

    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'apollo', page: 1, page_size: 20 }),
    )
    expect(result.items).toHaveLength(
      querySearchFixture.collection.items.length,
    )
    expect(footprint?.key.providerId).toBe(NASA_IVL_PROVIDER_ID)
    expect(footprint?.title).toBe('Apollo Footprint')
    expect(footprint?.image.href).toContain('/image/PIA24439/')
    expect(albumLogo?.albums).toEqual([
      {
        externalId: 'Apollo-at-50',
        providerId: NASA_IVL_PROVIDER_ID,
      },
    ])
    expect(result.pagination.total).toBe(
      querySearchFixture.collection.metadata.total_hits,
    )
  })

  it('maps nasa_id fixture responses into a single asset', async () => {
    mockSearch.mockResolvedValue(assetSearchFixture)

    const adapter = makeNasaIvlAdapter()
    const result = await adapter.getAsset('PIA24439')

    expect(mockSearch).toHaveBeenCalledWith({
      nasa_id: 'PIA24439',
    })
    expect(result).not.toBeNull()
    expect(result?.key.externalId).toBe('PIA24439')
    expect(result?.title).toBe('Apollo Footprint')
  })

  it('returns null when detail lookup does not find an asset', async () => {
    mockSearch.mockResolvedValue({
      ...assetSearchFixture,
      collection: {
        ...assetSearchFixture.collection,
        items: [],
      },
    })

    const adapter = makeNasaIvlAdapter()

    await expect(adapter.getAsset('missing-id')).resolves.toBeNull()
  })

  it('throws when detail lookup returns multiple assets', async () => {
    mockSearch.mockResolvedValue({
      ...assetSearchFixture,
      collection: {
        ...assetSearchFixture.collection,
        items: [
          ...assetSearchFixture.collection.items,
          ...assetSearchFixture.collection.items,
        ],
      },
    })

    const adapter = makeNasaIvlAdapter()

    await expect(adapter.getAsset('PIA24439')).rejects.toThrow(
      'Asset lookup returned multiple matches: PIA24439',
    )
  })

  it('maps real album fixture responses into paginated assets', async () => {
    mockGetAlbum.mockResolvedValue(albumFixture)

    const adapter = makeNasaIvlAdapter()
    const result = await adapter.getAlbum('Apollo-at-50', {
      page: 1,
      pageSize: 20,
    })

    expect(mockGetAlbum).toHaveBeenCalledWith('Apollo-at-50', { page: 1 })
    expect(result.items).toHaveLength(albumFixture.collection.items.length)
    expect(result.items[0]?.key.providerId).toBe(NASA_IVL_PROVIDER_ID)
    expect(result.items[0]?.albums).toEqual([
      {
        externalId: 'Apollo-at-50',
        providerId: NASA_IVL_PROVIDER_ID,
      },
    ])
    expect(result.pagination.total).toBe(
      albumFixture.collection.metadata.total_hits,
    )
    expect(result.pagination.next).toBeNull()
  })

  it('propagates album fetch errors', async () => {
    mockGetAlbum.mockRejectedValue(
      new Error(
        `Error fetching NASA media: ${invalidAlbumErrorFixture.reason}`,
      ),
    )

    const adapter = makeNasaIvlAdapter()

    await expect(
      adapter.getAlbum('invalid-album', { page: 1, pageSize: 20 }),
    ).rejects.toThrow(
      `Error fetching NASA media: ${invalidAlbumErrorFixture.reason}`,
    )
  })

  it('passes metadata through unchanged', async () => {
    mockGetMetadata.mockResolvedValue(metadataFixture)

    const adapter = makeNasaIvlAdapter()
    const result = await adapter.getMetadata('PIA24439')

    expect(mockGetMetadata).toHaveBeenCalledWith('PIA24439')
    expect(result['AVAIL:NASAID']).toBe('PIA24439')
    expect(result['AVAIL:Title']).toBe('Apollo Footprint')
  })

  it('propagates metadata fetch errors', async () => {
    mockGetMetadata.mockRejectedValue(new Error('Metadata fetch failed'))

    const adapter = makeNasaIvlAdapter()

    await expect(adapter.getMetadata('PIA24439')).rejects.toThrow(
      'Metadata fetch failed',
    )
  })
})
