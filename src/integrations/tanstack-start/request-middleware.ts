import { createMiddleware } from '@tanstack/react-start'
import { shouldReportError } from '@/lib/error-observability'
import { getPrivateDocumentCacheControlHeader } from '@/lib/route-policy'

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

function hasSupabaseAuthSetCookie(response: Response) {
  const setCookies = response.headers.getSetCookie()
  return setCookies.some((header) =>
    header.startsWith(SUPABASE_AUTH_COOKIE_PREFIX),
  )
}

/**
 * Safety net: if a Supabase auth session cookie is being set on an HTML document
 * response, force Cache-Control: private, no-store to prevent the response from
 * being cached at the CDN/proxy layer. This protects against a route that fails to
 * apply privateAnonymousBoundary but still processes auth tokens.
 */
export function createSetCookieSafetyNetMiddleware() {
  return createMiddleware().server(async ({ next }) => {
    const response = await next()
    if (!(response instanceof Response)) return response
    if (!isHtmlResponse(response)) return response
    if (!hasSupabaseAuthSetCookie(response)) return response

    const newHeaders = new Headers(response.headers)
    newHeaders.set('cache-control', getPrivateDocumentCacheControlHeader())
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  })
}

export function createDevelopmentServerErrorLoggingMiddleware() {
  return createMiddleware().server(async ({ next, request }) => {
    try {
      const response = await next()

      if (
        shouldLogServerErrorsInDevelopment() &&
        response instanceof Response &&
        isServerErrorResponse(response)
      ) {
        logDevelopmentServerError(request, {
          source: 'response',
          status: response.status,
        })
      }

      return response
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
