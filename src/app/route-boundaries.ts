import { requireAuthenticated } from './guards'
import {
  getPrivateDocumentCacheHeaders,
  getPublicDocumentCacheHeaders,
} from '@/lib/route-policy'

// Boundary factories return the complete route options for a policy root.
// The policy-reserved keys (headers, beforeLoad) are typed `never` on the
// input and merged last, so a route cannot override its subtree's cache/auth
// policy — attempting to pass either key is a type error, not a silent
// replacement the way an object spread would be.
type NonPolicyRouteOptions = {
  [key: string]: unknown
  headers?: never
  beforeLoad?: never
}

function nonPolicyOptions<TOptions extends NonPolicyRouteOptions>(
  options?: TOptions,
): Omit<TOptions, 'headers' | 'beforeLoad'> {
  const { headers: _headers, beforeLoad: _beforeLoad, ...rest } = options ?? {}
  return rest as Omit<TOptions, 'headers' | 'beforeLoad'>
}

// Public boundary: the SSR'd document is CDN-cacheable, so it must be
// byte-identical for every visitor. User-specific UI hydrates client-side.
export function publicBoundary<
  TOptions extends NonPolicyRouteOptions = NonPolicyRouteOptions,
>(options?: TOptions) {
  return {
    ...nonPolicyOptions(options),
    headers: () => getPublicDocumentCacheHeaders(),
  }
}

export function authenticatedBoundary<
  TOptions extends NonPolicyRouteOptions = NonPolicyRouteOptions,
>(options?: TOptions) {
  return {
    ...nonPolicyOptions(options),
    headers: () => getPrivateDocumentCacheHeaders(),
    beforeLoad: requireAuthenticated,
  }
}

// Token-bearing anonymous routes must not be cached: the URL contains a sensitive one-time token.
export function privateAnonymousBoundary<
  TOptions extends NonPolicyRouteOptions = NonPolicyRouteOptions,
>(options?: TOptions) {
  return {
    ...nonPolicyOptions(options),
    headers: () => getPrivateDocumentCacheHeaders(),
  }
}
