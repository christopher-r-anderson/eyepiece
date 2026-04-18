import { defaultStringifySearch } from '@tanstack/react-router'
import {
  sioaAssetCollectionResponseSchema,
  sioaAssetItemResponseSchema,
} from './types'
import type { SioaSearchParams } from './types'
import { SI_OA_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { ProviderClientError } from '@/integrations/provider-client-error'

const API_ROOT = 'https://api.si.edu/openaccess/api/v1.0'

const API_KEY_PARAM_NAME = 'api_key'

function sanitizeUrl(url: string) {
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.searchParams.has(API_KEY_PARAM_NAME)) {
      parsedUrl.searchParams.set(API_KEY_PARAM_NAME, 'REDACTED')
    }
    return parsedUrl.toString()
  } catch {
    return 'INVALID_URL'
  }
}

async function readMessage(response: Response) {
  let message = response.statusText

  try {
    const errorData = await response.json()
    if (typeof errorData.message === 'string' && errorData.message) {
      message = errorData.message
    }
  } catch {}

  return message
}

export async function search(params: SioaSearchParams, apiKey: string) {
  const url = `${API_ROOT}/search${defaultStringifySearch({ ...params, [API_KEY_PARAM_NAME]: apiKey })}`
  const response = await fetch(url)
  if (!response.ok) {
    const message = await readMessage(response)
    throw new ProviderClientError({
      providerId: SI_OA_PROVIDER_ID,
      operation: 'search.fetch',
      status: response.status,
      url: sanitizeUrl(url),
      message: `Error fetching Smithsonian search: ${message} ${sanitizeUrl(url)}`,
    })
  }
  const data = await response.json()
  return sioaAssetCollectionResponseSchema.parse(data)
}

export async function getContent(id: string, apiKey: string) {
  const url = `${API_ROOT}/content/${id}?api_key=${apiKey}`
  const response = await fetch(url)
  if (!response.ok) {
    const message = await readMessage(response)
    throw new ProviderClientError({
      providerId: SI_OA_PROVIDER_ID,
      operation: 'asset.fetch',
      status: response.status,
      url: sanitizeUrl(url),
      message: `Error fetching Smithsonian asset: ${message} ${sanitizeUrl(url)}`,
    })
  }
  const data = await response.json()
  return sioaAssetItemResponseSchema.parse(data)
}
