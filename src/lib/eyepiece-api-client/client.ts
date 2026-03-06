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
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { AlbumKey } from '@/domain/album/album.schema'
import { toAssetKeyString } from '@/domain/asset/asset.utils'
import { toAlbumKeyString } from '@/domain/album/album.utils'

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
        `Fix: createEyepieceClient({ origin: getOrigin() })`,
      ].join('\n'),
    )
  }
}

type EyepieceClientOptions = { origin?: string }

export type EyepieceClient = {
  getAsset: (key: AssetKey) => Promise<EyepieceAssetItem>
  getAlbum: (
    albumKey: AlbumKey,
    params?: EyepieceApiAlbumParams,
  ) => Promise<EyepieceAssetCollectionResponse>
  getMetadata: (key: AssetKey) => Promise<EyepieceMetadata>
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
      albumKey: AlbumKey,
      params: EyepieceApiAlbumParams = {},
    ) {
      const res = await fetch(
        withOrigin(
          `/api/albums/${toAlbumKeyString(albumKey)}${defaultStringifySearch(params)}`,
        ),
      )
      if (!res.ok) {
        throw new Error(`Error fetching album: ${res.statusText}`)
      }
      const data = await res.json()
      return eyepieceAssetCollectionResponseSchema.parse(data)
    },

    getAsset: async function getAsset(key: AssetKey) {
      const res = await fetch(
        withOrigin(`/api/asset/${encodeURIComponent(toAssetKeyString(key))}`),
      )
      if (!res.ok) {
        throw new Error(`Error fetching asset: ${res.statusText}`)
      }
      const data = await res.json()
      return eyepieceAssetItemSchema.parse(data)
    },

    getMetadata: async function getMetadata(key: AssetKey) {
      const res = await fetch(
        withOrigin(
          `/api/asset/${encodeURIComponent(toAssetKeyString(key))}/metadata`,
        ),
      )
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
