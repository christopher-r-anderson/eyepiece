import { createApiErrorResponse, formatValidationIssues } from './api-errors'
import type { ProviderId } from '@/domain/provider/provider.schema'
import type { z } from 'zod'
import { logErrorWithObservability } from '@/lib/error-logging'
import { providerIdSchema } from '@/domain/provider/provider.schema'

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
