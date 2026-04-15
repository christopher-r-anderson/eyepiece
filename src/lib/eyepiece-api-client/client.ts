import { defaultStringifySearch } from '@tanstack/react-router'
import type { InfiniteData } from '@tanstack/react-query'
import type { AlbumKey } from '@/domain/album/album.schema'
import type { Asset, AssetKey, Metadata } from '@/domain/asset/asset.schema'
import type {
  PaginatedCollection,
  Pagination,
} from '@/domain/pagination/pagination.schema'
import type { SearchFilters, SearchQuery } from '@/domain/search/search.schema'
import { createPaginatedCollectionSchema } from '@/domain/pagination/pagination.schema'
import { assetSchema, metadataSchema } from '@/domain/asset/asset.schema'

export function flattenAssetsSelector<TData extends { items: Array<Asset> }>({
  pages,
  ...rest
}: InfiniteData<TData, number>) {
  return {
    items: pages.flatMap((page) => page.items),
    ...rest,
  }
}

function assertSsrHasOrigin(origin: string, path: string) {
  if (import.meta.env.SSR && !origin) {
    throw new Error(
      [
        `SSR attempted to fetch a relative URL (${path}) without an origin.`,
        `This usually means the route loader didn't preload the query with an origin-aware client.`,
        `Fix: createEyepieceClient({ origin: getOrigin() })`,
      ].join('\n'),
    )
  }
}

type EyepieceClientOptions = { origin?: string }

export type EyepieceClient = {
  getAsset: (key: AssetKey) => Promise<Asset>
  getAlbum: (
    albumKey: AlbumKey,
    pagination: Pagination,
  ) => Promise<PaginatedCollection<Asset>>
  getMetadata: (key: AssetKey) => Promise<Metadata>
  searchAssets: (
    query: SearchQuery,
    filters: SearchFilters,
    pagination: Pagination,
  ) => Promise<PaginatedCollection<Asset>>
}

export function createEyepieceClient({
  origin = '',
}: EyepieceClientOptions = {}): EyepieceClient {
  const withOrigin = (path: string) => {
    if (!path.startsWith('/')) {
      throw new Error(`API path must start with "/": ${path}`)
    }
    assertSsrHasOrigin(origin, path)
    return `${origin}${path}`
  }

  return {
    getAlbum: async function getAlbum(key: AlbumKey, pagination: Pagination) {
      const res = await fetch(
        withOrigin(
          `/api/albums/${encodeURIComponent(key.providerId)}/${encodeURIComponent(key.externalId)}${defaultStringifySearch(pagination)}`,
        ),
      )
      if (!res.ok) {
        throw new Error(`Error fetching album: ${res.statusText}`)
      }
      const data = await res.json()
      return createPaginatedCollectionSchema<Asset>(assetSchema).parse(data)
    },

    getAsset: async function getAsset(key: AssetKey) {
      const res = await fetch(
        withOrigin(
          `/api/asset/${encodeURIComponent(key.providerId)}/${encodeURIComponent(key.externalId)}`,
        ),
      )
      if (!res.ok) {
        throw new Error(`Error fetching asset: ${res.statusText}`)
      }
      const data = await res.json()
      return assetSchema.parse(data)
    },

    getMetadata: async function getMetadata(key: AssetKey) {
      const res = await fetch(
        withOrigin(
          `/api/asset/${encodeURIComponent(key.providerId)}/${encodeURIComponent(key.externalId)}/metadata`,
        ),
      )
      if (!res.ok) {
        throw new Error(`Error fetching asset metadata: ${res.statusText}`)
      }
      const data = await res.json()
      return metadataSchema.parse(data)
    },

    searchAssets: async function searchAssets(
      query: SearchQuery,
      filters: SearchFilters,
      pagination: Pagination,
    ) {
      const res = await fetch(
        withOrigin(
          `/api/search${defaultStringifySearch({ providerId: filters.providerId, q: query, ...filters.filters, ...pagination })}`,
        ),
      )
      if (!res.ok) {
        throw new Error(`Error searching assets: ${res.statusText}`)
      }
      const data = await res.json()
      return createPaginatedCollectionSchema<Asset>(assetSchema).parse(data)
    },
  }
}
