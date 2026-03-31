import { defaultStringifySearch } from '@tanstack/react-router'
import {
  sioaAssetCollectionResponseSchema,
  sioaAssetItemResponseSchema,
} from './types'
import type { SioaSearchParams } from './types'

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

export async function search(params: SioaSearchParams, apiKey: string) {
  const url = `${API_ROOT}/search${defaultStringifySearch({ ...params, [API_KEY_PARAM_NAME]: apiKey })}`
  const response = await fetch(url)
  if (!response.ok) {
    let message = response.statusText
    try {
      const errorData = await response.json()
      if (errorData.message) {
        message = errorData.message
      }
    } catch (_) {}
    throw new Error(
      `Error fetching Smithsonian search: ${message} ${sanitizeUrl(url)}`,
    )
  }
  const data = await response.json()
  return sioaAssetCollectionResponseSchema.parse(data)
}

export async function getContent(id: string, apiKey: string) {
  const url = `${API_ROOT}/content/${id}?api_key=${apiKey}`
  const response = await fetch(url)
  if (!response.ok) {
    let message = response.statusText
    try {
      const errorData = await response.json()
      if (errorData.message) {
        message = errorData.message
      }
    } catch (_) {}
    throw new Error(
      `Error fetching Smithsonian asset: ${message} ${sanitizeUrl(url)}`,
    )
  }
  const data = await response.json()
  return sioaAssetItemResponseSchema.parse(data)
}
