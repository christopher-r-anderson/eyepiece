import { createMiddleware } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import type { z } from 'zod'

// TODO: expand zod error formatting for sentry elsewhere in the app and reuse here
// TODO: expand zod error formatting for client responses elsewhere in the app and reuse here
// TODO: use similar approaches to non zod errors in the app for both sentry calls and client responses
// TODO: cover other potential api errors besides middleware
// TODO: cover other endpoints besides apis with sentry handling and client responses
// TODO: reevaluate Result/Ok/Err usage and its format including, but not limited to,its inconsistent usage of `code` and `code`s generic approach
// TODO: get to a place where error handling throughout the app is consistent between result/err handling, sentry reporting, and client responses
// See: Sentry error integration in React 19 and Production Observability Plan for more details and context on the above TODOs:

function formatValidationIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
  }))
}

export function buildUrlSearchParamsMiddleware<T extends z.ZodType>(schema: T) {
  return createMiddleware().server(async ({ next, request }) => {
    const url = new URL(request.url)
    const result = schema.safeParse(
      Object.fromEntries(url.searchParams.entries()),
    )

    if (!result.success) {
      const issues = formatValidationIssues(result.error)

      Sentry.withScope((scope) => {
        scope.setLevel('warning')
        scope.setTag('error.kind', 'validation')
        scope.setTag('http.status_code', '400')
        scope.setContext('request', {
          url: request.url,
          method: request.method,
        })
        scope.setContext('validation', {
          issueCount: issues.length,
          issues,
        })
        Sentry.captureException(result.error)
      })

      return Response.json(
        {
          error: {
            code: 'INVALID_QUERY_PARAMS',
            message: 'One or more query parameters are invalid.',
            issues,
          },
        },
        { status: 400 },
      )
    }

    return next({
      context: {
        searchParams: result.data,
      },
    })
  })
}
