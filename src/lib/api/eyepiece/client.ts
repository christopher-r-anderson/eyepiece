import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import {
  type EyepieceSearchParams,
  eyepieceAssetCollectionResponseSchema,
  type EyepieceAlbumParams,
  eyepieceAssetItemSchema,
} from './types'

const HOST = 'http://localhost:3000'

export async function getAlbum(id: string, params?: EyepieceAlbumParams) {
  const res = await fetch(
    `${HOST}/api/albums/${id}?` +
      new URLSearchParams(Object.entries(params || {})),
  )
  if (!res.ok) {
    throw new Error(`Error fetching album: ${res.statusText}`)
  }
  const data = await res.json()
  return eyepieceAssetCollectionResponseSchema.parse(data)
}

type AlbumCacheKey = ['albums', string, EyepieceAlbumParams]

export function getAlbumOptions(id: string, params: EyepieceAlbumParams = {}) {
  return infiniteQueryOptions({
    queryKey: ['albums', id, params] as AlbumCacheKey,
    queryFn: ({ queryKey, pageParam = 1 }) => {
      return getAlbum(queryKey[1], { ...queryKey[2], page: pageParam })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
  })
}

export async function getAsset(id: string) {
  const res = await fetch(`${HOST}/api/asset/${id}`)
  if (!res.ok) {
    throw new Error(`Error fetching asset: ${res.statusText}`)
  }
  const data = await res.json()
  return eyepieceAssetItemSchema.parse(data)
}

type AssetCacheKey = ['assets', string]

export function getAssetOptions(id: string) {
  return queryOptions({
    queryKey: ['assets', id] as AssetCacheKey,
    queryFn: ({ queryKey }) => {
      return getAsset(queryKey[1])
    },
  })
}

export async function searchImages(params: EyepieceSearchParams) {
  const res = await fetch(
    `${HOST}/api/search?` + new URLSearchParams(Object.entries(params)),
  )
  if (!res.ok) {
    throw new Error(`Error searching assets: ${res.statusText}`)
  }
  const data = await res.json()
  return eyepieceAssetCollectionResponseSchema.parse(data)
}

type SearchCacheKey = ['search', EyepieceSearchParams]

export function searchImagesOptions(params: EyepieceSearchParams) {
  return infiniteQueryOptions({
    queryKey: ['search', params] as SearchCacheKey,
    queryFn: ({ queryKey, pageParam = 1 }) =>
      searchImages({ ...queryKey[1], page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
  })
}
