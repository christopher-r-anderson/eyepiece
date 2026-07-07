import { requireAuthenticated } from './guards'
import {
  getPrivateDocumentCacheHeaders,
  getPublicDocumentCacheHeaders,
} from './route-policy'
import type { PublicDocumentCacheHeaders } from './route-policy'

type PublicCacheHeaderOptions = {
  headers: () => PublicDocumentCacheHeaders
}

type PrivateCacheHeaderOptions = {
  headers: () => {
    'Cache-Control': string
  }
}

// Public boundary: the SSR'd document is CDN-cacheable, so it must be
// byte-identical for every visitor. User-specific UI hydrates client-side.
export const publicBoundary: PublicCacheHeaderOptions = {
  headers: () => getPublicDocumentCacheHeaders(),
}

export const authenticatedBoundary: PrivateCacheHeaderOptions & {
  beforeLoad: typeof requireAuthenticated
} = {
  headers: () => getPrivateDocumentCacheHeaders(),
  beforeLoad: requireAuthenticated,
}

// Token-bearing anonymous routes must not be cached: the URL contains a sensitive one-time token.
export const privateAnonymousBoundary: PrivateCacheHeaderOptions = {
  headers: () => getPrivateDocumentCacheHeaders(),
}
