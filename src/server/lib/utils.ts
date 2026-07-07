import { createApiErrorResponse, formatValidationIssues } from './api-errors'
import { setResponseHeadersSafely } from './response-headers'
import type { ProviderId } from '@/domain/provider/provider.schema'
import type { z } from 'zod'
import type { PublicDocumentCacheProfile } from '@/lib/route-policy'
import { logErrorWithObservability } from '@/lib/error-logging'
import { providerIdSchema } from '@/domain/provider/provider.schema'
import {
  NETLIFY_CDN_CACHE_CONTROL_HEADER_NAME,
  getPrivateDocumentCacheControlHeader,
  getPublicCdnCacheControlHeader,
  getPublicDocumentCacheControlHeader,
} from '@/lib/route-policy'

// CDN-directed cache headers must never survive a downgrade to private.
const PRIVATE_NO_STORE_HEADER_UPDATES = {
  'Cache-Control': getPrivateDocumentCacheControlHeader(),
  [NETLIFY_CDN_CACHE_CONTROL_HEADER_NAME]: null,
  'CDN-Cache-Control': null,
}

export function createPrivateNoStoreHeaders(headers?: HeadersInit): Headers {
  const responseHeaders = new Headers(headers)
  responseHeaders.set('Cache-Control', getPrivateDocumentCacheControlHeader())
  responseHeaders.delete(NETLIFY_CDN_CACHE_CONTROL_HEADER_NAME)
  responseHeaders.delete('CDN-Cache-Control')
  return responseHeaders
}

export function withPrivateNoStoreCacheControl(response: Response): Response {
  return setResponseHeadersSafely(response, PRIVATE_NO_STORE_HEADER_UPDATES)
}

export function createPublicCacheHeaders(
  headers?: HeadersInit,
  profile?: PublicDocumentCacheProfile,
): Headers {
  const responseHeaders = new Headers(headers)
  responseHeaders.set(
    'Cache-Control',
    getPublicDocumentCacheControlHeader(profile),
  )
  responseHeaders.set(
    NETLIFY_CDN_CACHE_CONTROL_HEADER_NAME,
    getPublicCdnCacheControlHeader(profile),
  )
  return responseHeaders
}

export function withPublicCacheControl(
  response: Response,
  profile?: PublicDocumentCacheProfile,
): Response {
  return setResponseHeadersSafely(response, {
    'Cache-Control': getPublicDocumentCacheControlHeader(profile),
    [NETLIFY_CDN_CACHE_CONTROL_HEADER_NAME]:
      getPublicCdnCacheControlHeader(profile),
  })
}

// params: {parse} will cause types in server routes to look correct, but the parsing will not actually be run
// handling in middleware like search params would require use to extract the params ourselves
// so server route handlers need to handle path param parsing themselves
export function parseOrThrowBadRequest<T extends z.ZodType>(
  schema: T,
  input: unknown,
  message: string = 'Invalid input',
  options?: {
    code?: string
    path?: string
  },
): z.infer<T> {
  const result = schema.safeParse(input)
  if (!result.success) {
    const response = createApiErrorResponse(
      {
        code: options?.code ?? 'INVALID_INPUT',
        message,
        issues: formatValidationIssues(result.error, options?.path),
      },
      400,
    )

    logErrorWithObservability(message, response, {
      validationError: result.error,
    })

    throw response
  }
  return result.data
}

export function parseOrThrowProviderId(input: unknown): ProviderId {
  return parseOrThrowBadRequest(providerIdSchema, input, 'Invalid providerId', {
    code: 'INVALID_PATH_PARAMS',
    path: 'providerId',
  })
}
