import { defaultStringifySearch } from '@tanstack/react-router'
import { nasaMediaCollectionResponseSchema, nasaMetadataSchema } from './types'
import type { NasaAlbumParams, NasaSearchParams } from './types'

const IMAGE_HOST = 'https://images-api.nasa.gov'
const ASSET_HOST = 'https://images-assets.nasa.gov'
// NASA Albums do not support page size, instead always returning 100 items per page
export const NASA_ALBUM_PAGE_SIZE = 100

export async function getAlbum(id: string, params: NasaAlbumParams = {}) {
  const url = `${IMAGE_HOST}/album/${id}${defaultStringifySearch(params)}`
  const response = await fetch(url)
  if (!response.ok) {
    let reason = response.statusText
    try {
      const errorData = await response.json()
      if (errorData.reason) {
        reason = errorData.reason
      }
    } catch (_) {}
    throw new Error(`Error fetching NASA media: ${reason} ${url}`)
  }
  const data = await response.json()

  return nasaMediaCollectionResponseSchema.parse(data)
}

export async function search(params: NasaSearchParams) {
  const url = `${IMAGE_HOST}/search${defaultStringifySearch(params)}`
  const response = await fetch(url)
  if (!response.ok) {
    let reason = response.statusText
    try {
      const errorData = await response.json()
      if (errorData.reason) {
        reason = errorData.reason
      }
    } catch (_) {}
    throw new Error(`Error fetching NASA media: ${reason} ${url}`)
  }
  const data = await response.json()
  return nasaMediaCollectionResponseSchema.parse(data)
}

export async function getMetadata(id: string) {
  const url = `${ASSET_HOST}/image/${id}/metadata.json`
  const response = await fetch(url)
  if (!response.ok) {
    let reason = response.statusText
    try {
      const errorData = await response.json()
      if (errorData.reason) {
        reason = errorData.reason
      }
    } catch (_) {}
    throw new Error(`Error fetching NASA asset metadata: ${reason} ${url}`)
  }
  const data = await response.json()
  return nasaMetadataSchema.parse(data)
}
