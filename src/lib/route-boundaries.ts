import { requireAuthenticated } from './guards'
import {
  getPrivateDocumentCacheControlHeader,
  getPublicDocumentCacheControlHeader,
} from './route-policy'

type CacheHeaderOptions = {
  headers: () => {
    'Cache-Control': string
  }
}

// Public boundary: the SSR'd document is CDN-cacheable, so it must be
// byte-identical for every visitor. User-specific UI hydrates client-side.
export const publicBoundary: CacheHeaderOptions = {
  headers: () => ({
    'Cache-Control': getPublicDocumentCacheControlHeader(),
  }),
}

export const authenticatedBoundary: CacheHeaderOptions & {
  beforeLoad: typeof requireAuthenticated
} = {
  headers: () => ({
    'Cache-Control': getPrivateDocumentCacheControlHeader(),
  }),
  beforeLoad: requireAuthenticated,
}

// Token-bearing anonymous routes must not be cached: the URL contains a sensitive one-time token.
export const privateAnonymousBoundary: CacheHeaderOptions = {
  headers: () => ({
    'Cache-Control': getPrivateDocumentCacheControlHeader(),
  }),
}
