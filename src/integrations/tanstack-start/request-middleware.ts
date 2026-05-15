import { createMiddleware } from '@tanstack/react-start'
import { shouldReportError } from '@/lib/error-observability'
import { getPrivateDocumentCacheControlHeader } from '@/lib/route-policy'

const SUPABASE_AUTH_COOKIE_PREFIX = 'sb-'

function getSetCookieAccessor(headers: Headers): (() => Array<string>) | null {
  const maybeGetSetCookie = (headers as Headers & { getSetCookie?: unknown })
    .getSetCookie

  if (typeof maybeGetSetCookie !== 'function') {
    return null
  }

  return maybeGetSetCookie.bind(headers) as () => Array<string>
}

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

function getSetCookieHeaders(headers: Headers) {
  const getSetCookie = getSetCookieAccessor(headers)
  if (getSetCookie) {
    const setCookies = getSetCookie()
    return setCookies
  }

  const setCookie = headers.get('set-cookie')
  return setCookie ? [setCookie] : []
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

function cloneHeadersPreservingSetCookie(headers: Headers) {
  const newHeaders = new Headers(headers)
  const setCookies = getSetCookieHeaders(headers)
  if (setCookies.length === 0) {
    return newHeaders
  }

  newHeaders.delete('set-cookie')
  for (const setCookie of setCookies) {
    newHeaders.append('set-cookie', setCookie)
  }
  return newHeaders
}

function forcePrivateNoStoreCacheControl(response: Response) {
  const cacheControl = getPrivateDocumentCacheControlHeader()

  try {
    response.headers.set('cache-control', cacheControl)
    return response
  } catch {
    const newHeaders = cloneHeadersPreservingSetCookie(response.headers)
    newHeaders.set('cache-control', cacheControl)
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  }
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
    const response = await next()
    if (!(response instanceof Response)) return response
    if (!isHtmlResponse(response) && !isRedirectResponse(response)) {
      return response
    }
    if (!hasSupabaseAuthSetCookie(response)) return response

    return forcePrivateNoStoreCacheControl(response)
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
