import { requireAuthenticatedShell } from './guards'
import {
  PRIVATE_ANONYMOUS_ROUTE_POLICY,
  PUBLIC_ROUTE_POLICY,
  getPrivateDocumentCacheControlHeader,
  getPublicDocumentCacheControlHeader,
} from './route-policy'

type CacheHeaderOptions = {
  headers: () => {
    'Cache-Control': string
  }
}

export const publicBoundary: CacheHeaderOptions & {
  beforeLoad: () => {
    userSupabaseClient: null
    routePolicy: typeof PUBLIC_ROUTE_POLICY
  }
} = {
  headers: () => ({
    'Cache-Control': getPublicDocumentCacheControlHeader(),
  }),
  beforeLoad: () => ({
    userSupabaseClient: null,
    routePolicy: PUBLIC_ROUTE_POLICY,
  }),
}

export const authenticatedBoundary: CacheHeaderOptions & {
  beforeLoad: typeof requireAuthenticatedShell
} = {
  headers: () => ({
    'Cache-Control': getPrivateDocumentCacheControlHeader(),
  }),
  beforeLoad: requireAuthenticatedShell,
}

// Token-bearing anonymous routes must not be cached: the URL contains a sensitive one-time token.
export const privateAnonymousBoundary: CacheHeaderOptions & {
  beforeLoad: () => {
    userSupabaseClient: null
    routePolicy: typeof PRIVATE_ANONYMOUS_ROUTE_POLICY
  }
} = {
  headers: () => ({
    'Cache-Control': getPrivateDocumentCacheControlHeader(),
  }),
  beforeLoad: () => ({
    userSupabaseClient: null,
    routePolicy: PRIVATE_ANONYMOUS_ROUTE_POLICY,
  }),
}
