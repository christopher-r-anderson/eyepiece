import {
  type NasaSearchParams,
  nasaMediaCollectionResponseSchema,
  type NasaAlbumParams,
} from './types'
import { defaultStringifySearch } from '@tanstack/react-router'

const HOST = 'https://images-api.nasa.gov'
// NASA Albums do not support page size, instead always returning 100 items per page
export const NASA_ALBUM_PAGE_SIZE = 100

export async function getAlbum(id: string, params: NasaAlbumParams = {}) {
  const url = `${HOST}/album/${id}${defaultStringifySearch(params)}`
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
  const url = `${HOST}/search${defaultStringifySearch(params)}`
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
