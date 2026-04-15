import type { ProviderId } from '@/domain/provider/provider.schema'
import type { z } from 'zod'
import { providerIdSchema } from '@/domain/provider/provider.schema'

// params: {parse} will cause types in server routes to look correct, but the parsing will not actually be run
// handling in middleware like search params would require use to extract the params ourselves
// so server route handlers need to handle path param parsing themselves
export function parseOrThrowBadRequest<T extends z.ZodType>(
  schema: T,
  input: unknown,
  message: string = 'Invalid input',
): z.infer<T> {
  const result = schema.safeParse(input)
  if (!result.success) {
    console.error(message, result.error)
    throw Response.json({ message, cause: result.error }, { status: 400 })
  }
  return result.data
}

export function parseOrThrowProviderId(input: unknown): ProviderId {
  return parseOrThrowBadRequest(providerIdSchema, input, 'Invalid providerId')
}
