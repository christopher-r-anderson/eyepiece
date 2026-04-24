import { defaultStringifySearch } from '@tanstack/react-router'
import type { InfiniteData } from '@tanstack/react-query'
import type { AlbumKey } from '@/domain/album/album.schema'
import type { Asset, AssetKey, Metadata } from '@/domain/asset/asset.schema'
import type {
  PaginatedCollection,
  Pagination,
} from '@/domain/pagination/pagination.schema'
import type { SearchFilters, SearchQuery } from '@/domain/search/search.schema'
import {
  SEARCH_URL,
  buildAlbumUrl,
  buildAssetMetadataUrl,
  buildAssetUrl,
} from '@/lib/api-paths'
import { createPaginatedCollectionSchema } from '@/domain/pagination/pagination.schema'
import { assetSchema, metadataSchema } from '@/domain/asset/asset.schema'

type ApiErrorBody = {
  error?: {
    code?: string
    message?: string
  }
}

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

async function readApiErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as ApiErrorBody
    if (typeof body.error?.message === 'string' && body.error.message) {
      return body.error.message
    }
  } catch {}

  return response.statusText || `Request failed with status ${response.status}`
}

async function throwApiClientError(
  prefix: string,
  response: Response,
): Promise<never> {
  const message = await readApiErrorMessage(response)
  throw new Error(`${prefix}: ${message}`)
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
          `${buildAlbumUrl(key.providerId, key.externalId)}${defaultStringifySearch(pagination)}`,
        ),
      )
      if (!res.ok) {
        await throwApiClientError('Error fetching album', res)
      }
      const data = await res.json()
      return createPaginatedCollectionSchema<Asset>(assetSchema).parse(data)
    },

    getAsset: async function getAsset(key: AssetKey) {
      const res = await fetch(
        withOrigin(buildAssetUrl(key.providerId, key.externalId)),
      )
      if (!res.ok) {
        await throwApiClientError('Error fetching asset', res)
      }
      const data = await res.json()
      return assetSchema.parse(data)
    },

    getMetadata: async function getMetadata(key: AssetKey) {
      const res = await fetch(
        withOrigin(buildAssetMetadataUrl(key.providerId, key.externalId)),
      )
      if (!res.ok) {
        await throwApiClientError('Error fetching asset metadata', res)
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
          `${SEARCH_URL}${defaultStringifySearch({ providerId: filters.providerId, q: query, ...filters.filters, ...pagination })}`,
        ),
      )
      if (!res.ok) {
        await throwApiClientError('Error searching assets', res)
      }
      const data = await res.json()
      return createPaginatedCollectionSchema<Asset>(assetSchema).parse(data)
    },
  }
}
