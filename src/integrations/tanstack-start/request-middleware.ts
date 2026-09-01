import { createMiddleware } from '@tanstack/react-start'
import { shouldReportError } from '@/lib/error-observability'
import { logErrorWithObservability } from '@/lib/error-logging'
import {
  NETLIFY_CDN_CACHE_CONTROL_HEADER_NAME,
  getPrivateDocumentCacheControlHeader,
} from '@/lib/route-policy'
import {
  getSessionReadReasons,
  runWithSessionReadTracking,
  wasSessionRead,
} from '@/server/lib/session-read-sentinel'
import {
  getSetCookieAccessor,
  getSetCookieHeaders,
  setResponseHeadersSafely,
} from '@/server/lib/response-headers'

const SUPABASE_AUTH_COOKIE_PREFIX = 'sb-'

function shouldLogServerErrorsInDevelopment() {
  return process.env.NODE_ENV === 'development'
}

function isServerErrorResponse(response: Response) {
  return response.status >= 500
}

function getRequestLabel(request: Request) {
  const url = new URL(request.url)

  return `${request.method} ${url.pathname}${url.search}`
}

function logDevelopmentServerError(request: Request, details: object) {
  console.error('[dev-server-error]', {
    request: getRequestLabel(request),
    ...details,
  })
}

function isHtmlResponse(response: Response) {
  const contentType = response.headers.get('content-type')
  return contentType?.startsWith('text/html') ?? false
}

function isRedirectResponse(response: Response) {
  return response.status >= 300 && response.status < 400
}

function isSupabaseAuthCookieSetCookieHeader(header: string) {
  const cookieName = header.match(/^\s*([^=;\s]+)=/)?.[1] ?? ''
  return cookieName.startsWith(SUPABASE_AUTH_COOKIE_PREFIX)
}

function hasSupabaseAuthSetCookie(response: Response) {
  if (
    !getSetCookieAccessor(response.headers) &&
    response.headers.has('set-cookie')
  ) {
    // Conservative fallback for runtimes without Headers#getSetCookie.
    return true
  }

  const setCookies = getSetCookieHeaders(response.headers)
  return setCookies.some((header) =>
    isSupabaseAuthCookieSetCookieHeader(header),
  )
}

function forcePrivateNoStoreCacheControl(response: Response) {
  return setResponseHeadersSafely(response, {
    'cache-control': getPrivateDocumentCacheControlHeader(),
    // CDN-directed cache headers must not survive a downgrade to private.
    [NETLIFY_CDN_CACHE_CONTROL_HEADER_NAME]: null,
    'CDN-Cache-Control': null,
  })
}

// TanStack Start's request-middleware chain passes a mutable context object
// through next(); the outgoing Response lives at ctx.response (thrown
// Responses are captured there too). A bare Response is also tolerated since
// the framework normalizes middleware return values. Middlewares must handle
// both shapes — treating next()'s result as the Response itself silently
// no-ops.
function getMiddlewareResponse(result: unknown): Response | null {
  if (result instanceof Response) return result
  if (result && typeof result === 'object' && 'response' in result) {
    const response = result.response
    if (response instanceof Response) return response
  }
  return null
}

function replaceMiddlewareResponse<T>(
  result: T,
  response: Response,
): T | Response {
  if (result instanceof Response) return response
  ;(result as { response: Response }).response = response
  return result
}

function hasCacheableCacheControl(response: Response) {
  const cacheControl = response.headers.get('cache-control')?.toLowerCase()
  if (!cacheControl) return false
  return cacheControl.includes('public') || cacheControl.includes('s-maxage')
}

function hasPrivateNoStoreCacheControl(response: Response) {
  const cacheControl = response.headers.get('cache-control')?.toLowerCase()
  if (!cacheControl) return false
  return cacheControl.includes('private') || cacheControl.includes('no-store')
}

/**
 * Session-read tripwire: the bottom-up counterpart to the route boundaries.
 * Boundaries declare intent top-down (this subtree is publicly cacheable);
 * this middleware verifies the render proved it. Any server-side auth-session
 * read during the request (tracked via the session-read sentinel) makes the
 * response ineligible for shared caching, no matter what headers the route
 * declared. A tripped wire on a publicly-cacheable response is a policy bug
 * and is reported to observability.
 *
 * Ordering is load-bearing (pinned in start.unit.test.ts): this middleware
 * must wrap all route work so loaders and handlers run inside its tracking
 * scope, and it must run *after* the Sentry request middleware, whose
 * per-request user-context enrichment reads auth claims for telemetry only —
 * outside the tracked scope, it intentionally does not trip the wire.
 *
 * Known limitation: headers are committed when body streaming starts, so a
 * session read inside a deferred/streamed segment cannot retro-downgrade the
 * response. Keep server session reads out of deferred data on public routes.
 */
export function createSessionReadTripwireMiddleware() {
  return createMiddleware().server(async ({ next, request }) => {
    return runWithSessionReadTracking(async () => {
      const result = await next()
      const response = getMiddlewareResponse(result)
      if (!response) return result
      if (!wasSessionRead()) return result
      if (hasPrivateNoStoreCacheControl(response)) return result

      if (hasCacheableCacheControl(response)) {
        // A publicly-cacheable response depended on the user's session: this
        // is a route-policy violation the boundaries could not see.
        logErrorWithObservability(
          'Session read on a publicly-cacheable response; downgrading to private, no-store',
          new Error('Session-read tripwire violation'),
          {
            request: getRequestLabel(request),
            cacheControl: response.headers.get('cache-control'),
            sessionReadReasons: getSessionReadReasons(),
          },
        )
      }

      return replaceMiddlewareResponse(
        result,
        forcePrivateNoStoreCacheControl(response),
      )
    })
  })
}

/**
 * Error responses are never publicly cacheable. Route boundary headers apply
 * to a subtree regardless of response status, so without this an SSR failure
 * on a public page would be served from the CDN for the full public TTL after
 * the underlying problem recovers. Mirrors the public API middleware rule
 * (2xx/3xx only).
 */
export function createErrorResponseCacheSafetyMiddleware() {
  return createMiddleware().server(async ({ next }) => {
    const result = await next()
    const response = getMiddlewareResponse(result)
    if (!response) return result
    if (response.status < 400) return result
    if (!hasCacheableCacheControl(response)) return result

    return replaceMiddlewareResponse(
      result,
      forcePrivateNoStoreCacheControl(response),
    )
  })
}

/**
 * Safety net: if a Supabase auth session cookie is being set on an HTML document
 * or redirect response, force Cache-Control: private, no-store to prevent the
 * response from being cached at the CDN/proxy layer. This protects against a
 * route that fails to apply privateAnonymousBoundary but still processes auth
 * tokens.
 */
export function createSetCookieSafetyNetMiddleware() {
  return createMiddleware().server(async ({ next }) => {
    const result = await next()
    const response = getMiddlewareResponse(result)
    if (!response) return result
    if (!isHtmlResponse(response) && !isRedirectResponse(response)) {
      return result
    }
    if (!hasSupabaseAuthSetCookie(response)) return result

    return replaceMiddlewareResponse(
      result,
      forcePrivateNoStoreCacheControl(response),
    )
  })
}

export function createDevelopmentServerErrorLoggingMiddleware() {
  return createMiddleware().server(async ({ next, request }) => {
    try {
      const result = await next()
      const response = getMiddlewareResponse(result)

      if (
        shouldLogServerErrorsInDevelopment() &&
        response &&
        isServerErrorResponse(response)
      ) {
        logDevelopmentServerError(request, {
          source: 'response',
          status: response.status,
        })
      }

      return result
    } catch (error) {
      if (shouldLogServerErrorsInDevelopment() && shouldReportError(error)) {
        logDevelopmentServerError(request, {
          source: 'exception',
          error,
        })
      }

      throw error
    }
  })
}
