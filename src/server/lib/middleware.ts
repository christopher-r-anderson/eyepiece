import { createMiddleware } from '@tanstack/react-start'
import { createApiErrorResponse, formatValidationIssues } from './api-errors'
import { withPrivateNoStoreCacheControl, withPublicCacheControl } from './utils'
import type { RequestServerResult } from '@tanstack/react-start'
import type { PublicDocumentCacheProfile } from '@/lib/route-policy'
import type { z } from 'zod'

type PublicApiCacheMiddlewareResult =
  | Response
  | RequestServerResult<{}, undefined, undefined>

// Only successful (2xx/3xx) responses are publicly cacheable. A cached error
// keeps serving failure for its full TTL after the upstream recovers, and
// error bodies are per-request noise, so 4xx/5xx go out private, no-store.
function applyApiCacheControlToResponse(
  response: Response,
  profile?: PublicDocumentCacheProfile,
): Response {
  return response.status < 400
    ? withPublicCacheControl(response, profile)
    : withPrivateNoStoreCacheControl(response)
}

function applyApiCacheControl(
  result: PublicApiCacheMiddlewareResult,
  profile?: PublicDocumentCacheProfile,
): PublicApiCacheMiddlewareResult {
  if (result instanceof Response) {
    return applyApiCacheControlToResponse(result, profile)
  }

  if ('response' in result && result.response instanceof Response) {
    result.response = applyApiCacheControlToResponse(result.response, profile)
  }

  return result
}

export function buildUrlSearchParamsMiddleware<T extends z.ZodType>(schema: T) {
  return createMiddleware().server(async ({ next, request }) => {
    const url = new URL(request.url)
    const result = schema.safeParse(
      Object.fromEntries(url.searchParams.entries()),
    )

    if (!result.success) {
      const issues = formatValidationIssues(result.error)

      return createApiErrorResponse(
        {
          code: 'INVALID_QUERY_PARAMS',
          message: 'One or more query parameters are invalid.',
          issues,
        },
        400,
      )
    }

    return next({
      context: {
        searchParams: result.data,
      },
    })
  })
}

export function buildPublicApiCacheMiddleware(
  profile?: PublicDocumentCacheProfile,
) {
  return createMiddleware().server(
    async ({ next }): Promise<PublicApiCacheMiddlewareResult> => {
      try {
        return applyApiCacheControl(await next(), profile)
      } catch (error) {
        if (error instanceof Response) {
          throw applyApiCacheControlToResponse(error, profile)
        }

        throw error
      }
    },
  )
}
