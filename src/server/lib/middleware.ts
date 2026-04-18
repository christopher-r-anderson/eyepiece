import { createMiddleware } from '@tanstack/react-start'
import { createApiErrorResponse, formatValidationIssues } from './api-errors'
import type { z } from 'zod'

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
