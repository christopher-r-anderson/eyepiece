import { z } from 'zod'

const redirectValueSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined
    if (val.startsWith('/') && !val.startsWith('//') && !val.includes('://'))
      return val
    return undefined
  })

const redirectSearchParamsSchema = z.object({
  next: redirectValueSchema,
})

// applied to `(pages)` route group which does not contain auth so all non auth pages can open the modal
export const authModalSearchParamsSchema = z.discriminatedUnion('auth', [
  z.object({
    auth: z.literal('login'),
    fp: z.literal(1).optional(),
  }),
  z.object({
    auth: z.literal('register'),
    fp: z.undefined().optional(),
  }),
  z.object({
    auth: z.undefined().optional(),
    fp: z.undefined().optional(),
  }),
])

export const authModalStateSchema = authModalSearchParamsSchema.transform(
  (data) => {
    if (data.auth === 'login') {
      return { authMode: 'login', showForgotPassword: data.fp === 1 }
    } else if (data.auth === 'register') {
      return { authMode: 'register' }
    } else {
      return { authMode: undefined }
    }
  },
)
export type AuthModalSearchParams = z.infer<typeof authModalSearchParamsSchema>
export type AuthModalState = z.infer<typeof authModalStateSchema>

// applied to all auth pages via the `(auth)` route group
export const authPageSearchParamsSchema = redirectSearchParamsSchema

export const confirmationTypeSchema = z.enum(['email', 'recovery'])

// validate token and always redirect, though it can redirect to home if nothing is provided or `/auth/confirm-error` if invalid
// does not inherit `next` from `(auth)` route group `validateSearch` because it is a server route not a page route
export const confirmationSearchParamsSchema = z
  .object({
    token_hash: z.string(),
    type: confirmationTypeSchema,
  })
  .extend(redirectSearchParamsSchema.shape)
