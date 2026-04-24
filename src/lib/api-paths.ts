/**
 * Centralized internal eyepiece API path definitions.
 *
 * `V1_ROUTE_PATHS` — static route pattern strings for use in `createFileRoute`
 * declarations and observability tags.
 *
 * `buildXxxUrl` functions — URL builders for the internal API client; they
 * percent-encode path segments so callers never need to do it themselves.
 */

const API_V1_PREFIX = '/api/v1' as const

export const V1_ROUTE_PATHS = {
  search: `${API_V1_PREFIX}/search`,
  asset: `${API_V1_PREFIX}/asset/$providerId/$assetId`,
  assetMetadata: `${API_V1_PREFIX}/asset/$providerId/$assetId/metadata`,
  album: `${API_V1_PREFIX}/albums/$providerId/$albumId`,
} as const

export function buildAssetUrl(providerId: string, externalId: string): string {
  return `${API_V1_PREFIX}/asset/${encodeURIComponent(providerId)}/${encodeURIComponent(externalId)}`
}

export function buildAssetMetadataUrl(
  providerId: string,
  externalId: string,
): string {
  return `${API_V1_PREFIX}/asset/${encodeURIComponent(providerId)}/${encodeURIComponent(externalId)}/metadata`
}

export function buildAlbumUrl(providerId: string, externalId: string): string {
  return `${API_V1_PREFIX}/albums/${encodeURIComponent(providerId)}/${encodeURIComponent(externalId)}`
}

export const SEARCH_URL = `${API_V1_PREFIX}/search` as const
