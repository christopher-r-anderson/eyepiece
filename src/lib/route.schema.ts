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

export const redirectSearchParamsSchema = z.object({
  next: redirectValueSchema,
})
