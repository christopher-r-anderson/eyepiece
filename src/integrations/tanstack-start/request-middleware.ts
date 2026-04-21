import { createMiddleware } from '@tanstack/react-start'
import { shouldReportError } from '@/lib/error-observability'

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
