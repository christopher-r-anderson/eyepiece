import { defaultStringifySearch } from '@tanstack/react-router'
import { nasaMediaCollectionResponseSchema, nasaMetadataSchema } from './types'
import type { NasaAlbumParams, NasaSearchParams } from './types'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { ProviderClientError } from '@/integrations/provider-client-error'

const IMAGE_HOST = 'https://images-api.nasa.gov'
const ASSET_HOST = 'https://images-assets.nasa.gov'
// NASA Albums do not support page size, instead always returning 100 items per page
export const NASA_ALBUM_PAGE_SIZE = 100

function stringifyParams(params: Record<string, any>): string {
  return defaultStringifySearch(
    Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(',') : value,
      ]),
    ),
  )
}

async function readReason(response: Response) {
  let reason = response.statusText

  try {
    const errorData = await response.json()
    if (typeof errorData.reason === 'string' && errorData.reason) {
      reason = errorData.reason
    }
  } catch {}

  return reason
}

function isAlbumNotFoundResponse(status: number, reason: string) {
  return status === 404 || /^No assets found for album=/i.test(reason)
}

export async function getAlbum(id: string, params: NasaAlbumParams = {}) {
  const url = `${IMAGE_HOST}/album/${id}${stringifyParams(params)}`
  const response = await fetch(url)
  if (!response.ok) {
    const reason = await readReason(response)
    throw new ProviderClientError({
      providerId: NASA_IVL_PROVIDER_ID,
      operation: 'album.fetch',
      status: response.status,
      kind: isAlbumNotFoundResponse(response.status, reason)
        ? 'not_found'
        : undefined,
      url,
      message: `Error fetching NASA media: ${reason} ${url}`,
    })
  }
  const data = await response.json()

  return nasaMediaCollectionResponseSchema.parse(data)
}

export async function search(params: NasaSearchParams) {
  const url = `${IMAGE_HOST}/search${stringifyParams(params)}`
  const response = await fetch(url)
  if (!response.ok) {
    const reason = await readReason(response)
    throw new ProviderClientError({
      providerId: NASA_IVL_PROVIDER_ID,
      operation: 'search.fetch',
      status: response.status,
      url,
      message: `Error fetching NASA media: ${reason} ${url}`,
    })
  }
  const data = await response.json()
  return nasaMediaCollectionResponseSchema.parse(data)
}

export async function getMetadata(id: string) {
  const url = `${ASSET_HOST}/image/${id}/metadata.json`
  const response = await fetch(url)
  if (!response.ok) {
    const reason = await readReason(response)
    throw new ProviderClientError({
      providerId: NASA_IVL_PROVIDER_ID,
      operation: 'metadata.fetch',
      status: response.status,
      url,
      message: `Error fetching NASA asset metadata: ${reason} ${url}`,
    })
  }
  const data = await response.json()
  return nasaMetadataSchema.parse(data)
}
