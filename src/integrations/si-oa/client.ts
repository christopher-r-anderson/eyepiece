import {
  sioaAssetCollectionResponseSchema,
  sioaAssetItemResponseSchema,
  sioaImageInfoSchema,
} from './types'
import type { SioaSearchParams } from './types'
import { stringifySearchParams } from '@/lib/search-params'
import { SI_OA_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { ProviderClientError } from '@/integrations/provider-client-error'
import { providerFetch } from '@/integrations/provider-fetch'

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
  const url = `${API_ROOT}/search${stringifySearchParams({ ...params, [API_KEY_PARAM_NAME]: apiKey })}`
  const response = await providerFetch(url)
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

// The delivery service is a IIIF Image API 2.0 level 2 server, so it reports
// the master's real size and will cut any width from it. The Open Access
// records themselves declare a size on the hi-res resources only.
export const IDS_ROOT = 'https://ids.si.edu/ids/iiif'

export function buildIdsRenditionUrl(idsId: string, width: number) {
  return `${IDS_ROOT}/${encodeURIComponent(idsId)}/full/${width},/0/default.jpg`
}

// a 569-byte response that typically answers in well under a second; the
// lookup is best-effort on the search path, so a stalled delivery service
// must cost seconds, not the full provider deadline
const IMAGE_INFO_DEADLINE_MS = 5_000

export async function getImageInfo(idsId: string) {
  const url = `${IDS_ROOT}/${encodeURIComponent(idsId)}/info.json`
  const response = await providerFetch(url, {
    deadlineMs: IMAGE_INFO_DEADLINE_MS,
  })
  if (!response.ok) {
    const message = await readMessage(response)
    throw new ProviderClientError({
      providerId: SI_OA_PROVIDER_ID,
      operation: 'image.info.fetch',
      status: response.status,
      url,
      message: `Error fetching Smithsonian image info: ${message} ${url}`,
    })
  }
  const data = await response.json()
  return sioaImageInfoSchema.parse(data)
}

export async function getContent(id: string, apiKey: string) {
  const url = `${API_ROOT}/content/${id}?api_key=${apiKey}`
  const response = await providerFetch(url)
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
