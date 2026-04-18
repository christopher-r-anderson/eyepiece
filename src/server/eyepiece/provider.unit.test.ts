import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { hasAlbums, hasMetadata } from './provider'
import type {
  AlbumsCapability,
  BaseProvider,
  MetadataCapability,
} from './provider'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'

const filtersSchema = z.object({})

function makeBaseProvider(): BaseProvider<
  typeof NASA_IVL_PROVIDER_ID,
  typeof filtersSchema
> {
  return {
    getProviderId: () => NASA_IVL_PROVIDER_ID,
    capabilities: {},
    getSearchFiltersSchema: () => filtersSchema,
    searchAssets: () =>
      Promise.resolve({
        items: [],
        pagination: { next: null, total: 0 },
      }),
    getAsset: () => Promise.resolve(null),
  }
}

describe('provider capability guards', () => {
  it('detects album capability from explicit provider capabilities', () => {
    const baseProvider = makeBaseProvider()
    const albumsProvider = {
      ...baseProvider,
      capabilities: { albums: true as const },
      getAlbum: () =>
        Promise.resolve({
          items: [],
          pagination: { next: null, total: 0 },
        }),
    }

    expect(hasAlbums(baseProvider)).toBe(false)
    expect(hasAlbums(albumsProvider)).toBe(true)
  })

  it('detects metadata capability from explicit provider capabilities', () => {
    const baseProvider = makeBaseProvider()
    const metadataProvider = {
      ...baseProvider,
      capabilities: { metadata: true as const },
      getMetadata: () => Promise.resolve({}),
    }

    expect(hasMetadata(baseProvider)).toBe(false)
    expect(hasMetadata(metadataProvider)).toBe(true)
  })

  it('narrows provider types after guard checks', async () => {
    const provider = {
      ...makeBaseProvider(),
      capabilities: { albums: true as const, metadata: true as const },
      getAlbum: () =>
        Promise.resolve({
          items: [],
          pagination: { next: null, total: 0 },
        }),
      getMetadata: () => Promise.resolve({ source: 'test' }),
    } as BaseProvider<typeof NASA_IVL_PROVIDER_ID, typeof filtersSchema> &
      AlbumsCapability &
      MetadataCapability

    if (hasAlbums(provider)) {
      const album = await provider.getAlbum('a1', { page: 1, pageSize: 10 })
      expect(album.pagination.total).toBe(0)
    }

    if (hasMetadata(provider)) {
      const metadata = await provider.getMetadata('a1')
      expect(metadata).toEqual({ source: 'test' })
    }
  })
})
