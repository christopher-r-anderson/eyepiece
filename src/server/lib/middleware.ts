import { createMiddleware } from '@tanstack/react-start'
import type { z } from 'zod'

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
