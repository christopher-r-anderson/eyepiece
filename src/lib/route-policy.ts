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
