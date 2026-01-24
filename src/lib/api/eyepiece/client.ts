import { defaultStringifySearch } from '@tanstack/react-router'
import {
  eyepieceAssetCollectionResponseSchema,
  eyepieceAssetItemSchema,
  eyepieceMetadataSchema,
} from './types'
import type {
  EyepieceApiAlbumParams,
  EyepieceApiSearchParams,
  EyepieceAssetCollectionResponse,
  EyepieceAssetItem,
  EyepieceMetadata,
} from './types'
import type { InfiniteData } from '@tanstack/react-query'

export function flattenAssetsSelector<
  TData extends { assets: Array<EyepieceAssetItem> },
>({ pages, ...rest }: InfiniteData<TData, number>) {
  return {
    assets: pages.flatMap((page) => page.assets),
    ...rest,
  }
}

function assertSsrHasOrigin(origin: string, path: string) {
  if (import.meta.env.SSR && !origin) {
    throw new Error(
      [
        `SSR attempted to fetch a relative URL (${path}) without an origin.`,
        `This usually means the route loader didn't preload the query with an origin-aware client.`,
        `Fix: preload this query in the route loader using origin = location.url.origin.`,
      ].join('\n'),
    )
  }
}

type EyepieceClientOptions = { origin?: string }

export type EyepieceClient = {
  getAsset: (id: string) => Promise<EyepieceAssetItem>
  getAlbum: (
    id: string,
    params?: EyepieceApiAlbumParams,
  ) => Promise<EyepieceAssetCollectionResponse>
  getMetadata: (id: string) => Promise<EyepieceMetadata>
  searchImages: (
    params: EyepieceApiSearchParams,
  ) => Promise<EyepieceAssetCollectionResponse>
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
    getAlbum: async function getAlbum(
      id: string,
      params: EyepieceApiAlbumParams = {},
    ) {
      const res = await fetch(
        withOrigin(`/api/albums/${id}${defaultStringifySearch(params)}`),
      )
      if (!res.ok) {
        throw new Error(`Error fetching album: ${res.statusText}`)
      }
      const data = await res.json()
      return eyepieceAssetCollectionResponseSchema.parse(data)
    },

    getAsset: async function getAsset(id: string) {
      const res = await fetch(withOrigin(`/api/asset/${id}`))
      if (!res.ok) {
        throw new Error(`Error fetching asset: ${res.statusText}`)
      }
      const data = await res.json()
      return eyepieceAssetItemSchema.parse(data)
    },

    getMetadata: async function getMetadata(id: string) {
      const res = await fetch(withOrigin(`/api/asset/${id}/metadata`))
      if (!res.ok) {
        throw new Error(`Error fetching asset metadata: ${res.statusText}`)
      }
      const data = await res.json()
      return eyepieceMetadataSchema.parse(data)
    },

    searchImages: async function searchImages(params: EyepieceApiSearchParams) {
      const res = await fetch(
        withOrigin(`/api/search${defaultStringifySearch(params)}`),
      )
      if (!res.ok) {
        throw new Error(`Error searching assets: ${res.statusText}`)
      }
      const data = await res.json()
      return eyepieceAssetCollectionResponseSchema.parse(data)
    },
  }
}
