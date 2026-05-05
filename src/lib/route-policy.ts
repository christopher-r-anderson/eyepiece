import type { SupabaseClient } from '@/integrations/supabase/types'

export type RouteAccessPolicy = {
  audience: 'public' | 'authenticated'
  allowUserSupabaseClient: boolean
  cacheControlScope: 'public' | 'private'
}

export const PUBLIC_ROUTE_POLICY: RouteAccessPolicy = {
  audience: 'public',
  allowUserSupabaseClient: false,
  cacheControlScope: 'public',
}

export const AUTHENTICATED_ROUTE_POLICY: RouteAccessPolicy = {
  audience: 'authenticated',
  allowUserSupabaseClient: true,
  cacheControlScope: 'private',
}

// For token-bearing anonymous routes (confirm, magic link, OAuth callback).
// The user is not authenticated, but the response must never be cached.
export const PRIVATE_ANONYMOUS_ROUTE_POLICY: RouteAccessPolicy = {
  audience: 'public',
  allowUserSupabaseClient: false,
  cacheControlScope: 'private',
}

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

export function getDocumentCacheControlHeader(
  policy: RouteAccessPolicy,
  publicProfile: PublicDocumentCacheProfile = DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE,
) {
  return policy.cacheControlScope === 'public'
    ? getPublicDocumentCacheControlHeader(publicProfile)
    : getPrivateDocumentCacheControlHeader()
}

export function requireUserSupabaseClient(context: {
  userSupabaseClient: SupabaseClient | null
  routePolicy: RouteAccessPolicy
}): SupabaseClient {
  if (!context.routePolicy.allowUserSupabaseClient) {
    throw new Error(
      'User Supabase client access is forbidden for this route policy.',
    )
  }

  if (!context.userSupabaseClient) {
    throw new Error(
      'User Supabase client is not available in this route context. ' +
        'This route must be under the authenticated capability shell.',
    )
  }

  return context.userSupabaseClient
}
