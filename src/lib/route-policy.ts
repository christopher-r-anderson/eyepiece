export type PublicDocumentCacheProfile = {
  maxAge: number
  sMaxAge: number
  staleWhileRevalidate: number
}

export const DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE: PublicDocumentCacheProfile =
  {
    maxAge: 0,
    sMaxAge: 300,
    staleWhileRevalidate: 300,
  }

export const PRIVATE_DOCUMENT_CACHE_CONTROL = 'private, no-store'

function assertValidCacheProfileValue(name: string, value: number) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`)
  }
}

function formatPublicDocumentCacheControl(profile: PublicDocumentCacheProfile) {
  return `public, max-age=${profile.maxAge}, s-maxage=${profile.sMaxAge}, stale-while-revalidate=${profile.staleWhileRevalidate}`
}

export const PUBLIC_DOCUMENT_CACHE_CONTROL = formatPublicDocumentCacheControl(
  DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE,
)

export function getPublicDocumentCacheControlHeader(
  profile: PublicDocumentCacheProfile = DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE,
) {
  assertValidCacheProfileValue('maxAge', profile.maxAge)
  assertValidCacheProfileValue('sMaxAge', profile.sMaxAge)
  assertValidCacheProfileValue(
    'staleWhileRevalidate',
    profile.staleWhileRevalidate,
  )

  return formatPublicDocumentCacheControl(profile)
}

export function getPrivateDocumentCacheControlHeader() {
  return PRIVATE_DOCUMENT_CACHE_CONTROL
}

// Netlify reads this header at its edge and strips it from the response, so
// browsers and other CDNs never see it. `durable` opts into Netlify's durable
// cache tier (shared across edge nodes, persists until deploy or purge).
export const NETLIFY_CDN_CACHE_CONTROL_HEADER_NAME = 'Netlify-CDN-Cache-Control'

function formatPublicCdnCacheControl(profile: PublicDocumentCacheProfile) {
  return `public, s-maxage=${profile.sMaxAge}, stale-while-revalidate=${profile.staleWhileRevalidate}, durable`
}

export function getPublicCdnCacheControlHeader(
  profile: PublicDocumentCacheProfile = DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE,
) {
  assertValidCacheProfileValue('sMaxAge', profile.sMaxAge)
  assertValidCacheProfileValue(
    'staleWhileRevalidate',
    profile.staleWhileRevalidate,
  )

  return formatPublicCdnCacheControl(profile)
}

export type PublicDocumentCacheHeaders = {
  'Cache-Control': string
  'Netlify-CDN-Cache-Control': string
}

// Both headers are emitted on purpose: the standard Cache-Control keeps
// s-maxage for CDN portability (CloudFront ignores CDN-Cache-Control
// variants entirely and only honors s-maxage), while the Netlify header
// carries the Netlify-specific durable directive.
export function getPublicDocumentCacheHeaders(
  profile: PublicDocumentCacheProfile = DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE,
): PublicDocumentCacheHeaders {
  return {
    'Cache-Control': getPublicDocumentCacheControlHeader(profile),
    'Netlify-CDN-Cache-Control': getPublicCdnCacheControlHeader(profile),
  }
}

export function getPrivateDocumentCacheHeaders(): { 'Cache-Control': string } {
  return { 'Cache-Control': getPrivateDocumentCacheControlHeader() }
}
