import { z } from 'zod'
import {
  formResultSearchParamsSchema,
  redirectSearchParamsSchema,
} from '@/lib/route.schema'

// applied to all auth pages via the `(auth)` route group
export const authPageSearchParamsSchema = redirectSearchParamsSchema.extend(
  formResultSearchParamsSchema.shape,
)

export const confirmationTypeSchema = z.enum(['email', 'recovery'])

// validate token and always redirect, though it can redirect to home if nothing is provided or `/auth/confirm-error` if invalid
// does not inherit `next` from `(auth)` route group `validateSearch` because it is a server route not a page route
export const confirmationSearchParamsSchema = z
  .object({
    token_hash: z.string(),
    type: confirmationTypeSchema,
  })
  .extend(redirectSearchParamsSchema.shape)
