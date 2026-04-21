import type { z } from 'zod'

export type ApiErrorIssue = {
  path: string
  code: string
  message: string
}

export type ApiErrorPayload = {
  error: {
    code: string
    message: string
    issues?: Array<ApiErrorIssue>
  }
}

export function formatValidationIssues(
  error: z.ZodError,
  pathPrefix?: string,
): Array<ApiErrorIssue> {
  return error.issues.map((issue) => ({
    path: [pathPrefix, ...issue.path.map(String)].filter(Boolean).join('.'),
    code: issue.code,
    message: issue.message,
  }))
}

export function createApiErrorResponse(
  error: ApiErrorPayload['error'],
  status: number,
): Response {
  return Response.json({ error }, { status })
}

export function createNotFoundResponse(
  message: string = 'Resource does not exist',
): Response {
  return createApiErrorResponse(
    {
      code: 'NOT_FOUND',
      message,
    },
    404,
  )
}

export function createUnsupportedOperationResponse(message: string): Response {
  return createApiErrorResponse(
    {
      code: 'UNSUPPORTED_PROVIDER_OPERATION',
      message,
    },
    501,
  )
}
