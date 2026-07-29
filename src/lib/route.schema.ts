import { z } from 'zod'

// browsers normalize Location values before following them (a leading '/\\'
// becomes '//', backslashes become slashes), so string prefix checks are
// not enough: parse against a fixed origin exactly as a browser would and
// require the result to stay on it
const PARSE_ORIGIN = 'http://parse.local'

const redirectValueSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val || !val.startsWith('/')) return undefined
    try {
      if (new URL(val, PARSE_ORIGIN).origin !== PARSE_ORIGIN) return undefined
    } catch {
      return undefined
    }
    return val
  })

export const nextSchema = redirectValueSchema

export const redirectSearchParamsSchema = z.object({
  next: redirectValueSchema,
})

// the one-shot params a native (no-JS) form post's redirect carries back:
// formError is an error code, mapped to copy client-side
export const formResultSearchParamsSchema = z.object({
  formError: z.string().max(64).optional(),
  status: z.enum(['sent', 'updated']).optional(),
})
