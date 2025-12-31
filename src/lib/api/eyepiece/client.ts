import { defaultStringifySearch } from '@tanstack/react-router'
import { InfiniteData } from '@tanstack/react-query'
import {
  type EyepieceApiSearchParams,
  eyepieceAssetCollectionResponseSchema,
  type EyepieceApiAlbumParams,
  eyepieceAssetItemSchema,
  EyepieceAssetItem,
} from './types'

const API_HOST = import.meta.env.SSR
  ? import.meta.env.VITE_API_URL || 'http://localhost:3000'
  : ''

export function flattenAssetsSelector<
  TData extends { assets: EyepieceAssetItem[] },
>({ pages, ...rest }: InfiniteData<TData, number>) {
  return {
    assets: pages.flatMap((page) => page.assets),
    ...rest,
  }
}

export async function getAlbum(
  id: string,
  params: EyepieceApiAlbumParams = {},
) {
  const res = await fetch(
    `${API_HOST}/api/albums/${id}${defaultStringifySearch(params)}`,
  )
  if (!res.ok) {
    throw new Error(`Error fetching album: ${res.statusText}`)
  }
  const data = await res.json()
  return eyepieceAssetCollectionResponseSchema.parse(data)
}

export async function getAsset(id: string) {
  const res = await fetch(`${API_HOST}/api/asset/${id}`)
  if (!res.ok) {
    throw new Error(`Error fetching asset: ${res.statusText}`)
  }
  const data = await res.json()
  return eyepieceAssetItemSchema.parse(data)
}

export async function searchImages(params: EyepieceApiSearchParams) {
  const res = await fetch(
    `${API_HOST}/api/search${defaultStringifySearch(params)}`,
  )
  if (!res.ok) {
    throw new Error(`Error searching assets: ${res.statusText}`)
  }
  const data = await res.json()
  return eyepieceAssetCollectionResponseSchema.parse(data)
}
