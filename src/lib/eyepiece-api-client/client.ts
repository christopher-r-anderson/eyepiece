import type { InfiniteData } from '@tanstack/react-query'
import type {
  AlbumCollectionMetadata,
  AlbumKey,
} from '@/domain/album/album.schema'
import type { Asset, AssetKey, Metadata } from '@/domain/asset/asset.schema'
import type {
  CursorPageRequest,
  PaginatedCollection,
} from '@/domain/pagination/pagination.schema'
import type { SearchFilters, SearchQuery } from '@/domain/search/search.schema'
import { stringifyApiSearchParams } from '@/lib/search-params'
import {
  SEARCH_URL,
  buildAlbumUrl,
  buildAssetMetadataUrl,
  buildAssetUrl,
} from '@/lib/api-paths'
import {
  albumResponseSchema,
  assetMetadataResponseSchema,
  assetResponseSchema,
  searchResponseSchema,
} from '@/lib/eyepiece-api-contracts'

type ApiErrorBody = {
  error?: {
    code?: string
    message?: string
  }
}

function flattenAssetsSelector<TData extends { items: Array<Asset> }>({
  pages,
  ...rest
}: InfiniteData<TData, string>) {
  return {
    items: pages.flatMap((page) => page.items),
    ...rest,
  }
}

export function flattenAssetsWithTotalSelector<
  TData extends { items: Array<Asset>; pagination: { total: number } },
>(data: InfiniteData<TData, string>) {
  return {
    ...flattenAssetsSelector(data),
    total: data.pages[0]?.pagination.total ?? 0,
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

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as ApiErrorBody
    return { message: body.error?.message, code: body.error?.code }
  } catch {
    return { message: undefined, code: undefined }
  }
}

export class EyepieceApiError extends Error {
  readonly status: number
  readonly code: string | undefined

  constructor(message: string, status: number, code: string | undefined) {
    super(message)
    this.name = 'EyepieceApiError'
    this.status = status
    this.code = code
  }
}

export function isNotFoundApiError(error: unknown): boolean {
  return error instanceof EyepieceApiError && error.status === 404
}

async function throwApiClientError(
  prefix: string,
  response: Response,
): Promise<never> {
  const { message, code } = await readApiError(response)
  const detail =
    message ||
    response.statusText ||
    `Request failed with status ${response.status}`
  throw new EyepieceApiError(`${prefix}: ${detail}`, response.status, code)
}

type EyepieceClientOptions = { origin?: string }

export type EyepieceClient = {
  getAsset: (key: AssetKey) => Promise<Asset>
  getAlbum: (
    albumKey: AlbumKey,
    page: CursorPageRequest,
  ) => Promise<PaginatedCollection<Asset, AlbumCollectionMetadata>>
  getMetadata: (key: AssetKey) => Promise<Metadata>
  searchAssets: (
    query: SearchQuery,
    filters: SearchFilters,
    page: CursorPageRequest,
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
    getAlbum: async function getAlbum(key: AlbumKey, page: CursorPageRequest) {
      const res = await fetch(
        withOrigin(
          `${buildAlbumUrl(key.providerId, key.externalId)}${stringifyApiSearchParams(page)}`,
        ),
      )
      if (!res.ok) {
        await throwApiClientError('Error fetching album', res)
      }
      const data = await res.json()
      return albumResponseSchema.parse(data)
    },

    getAsset: async function getAsset(key: AssetKey) {
      const res = await fetch(
        withOrigin(buildAssetUrl(key.providerId, key.externalId)),
      )
      if (!res.ok) {
        await throwApiClientError('Error fetching asset', res)
      }
      const data = await res.json()
      return assetResponseSchema.parse(data)
    },

    getMetadata: async function getMetadata(key: AssetKey) {
      const res = await fetch(
        withOrigin(buildAssetMetadataUrl(key.providerId, key.externalId)),
      )
      if (!res.ok) {
        await throwApiClientError('Error fetching asset metadata', res)
      }
      const data = await res.json()
      return assetMetadataResponseSchema.parse(data)
    },

    searchAssets: async function searchAssets(
      query: SearchQuery,
      filters: SearchFilters,
      page: CursorPageRequest,
    ) {
      const res = await fetch(
        withOrigin(
          `${SEARCH_URL}${stringifyApiSearchParams({ providerId: filters.providerId, q: query, ...filters.filters, ...page })}`,
        ),
      )
      if (!res.ok) {
        await throwApiClientError('Error searching assets', res)
      }
      const data = await res.json()
      return searchResponseSchema.parse(data)
    },
  }
}
