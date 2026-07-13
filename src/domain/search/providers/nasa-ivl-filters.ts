import { z } from 'zod'

export const YEAR_MIN = 1920
export const YEAR_MAX = new Date().getFullYear()

export const nasaIvlMediaTypeSchema = z.enum(['image', 'video', 'audio'])

export type NasaIvlMediaType = z.infer<typeof nasaIvlMediaTypeSchema>

export const nasaIvlSearchFiltersSchema = z.object({
  mediaType: nasaIvlMediaTypeSchema.optional(),
  yearStart: z.coerce.number().min(YEAR_MIN).max(YEAR_MAX).optional(),
  yearEnd: z.coerce.number().min(YEAR_MIN).max(YEAR_MAX).optional(),
})

export type NasaIvlSearchFilters = z.infer<typeof nasaIvlSearchFiltersSchema>

// URL-boundary variant: invalid values drop per key instead of failing the
// whole parse.
export const nasaIvlSearchFiltersLenientSchema = z.object({
  mediaType: nasaIvlMediaTypeSchema.optional().catch(undefined),
  yearStart: z.coerce
    .number()
    .min(YEAR_MIN)
    .max(YEAR_MAX)
    .optional()
    .catch(undefined),
  yearEnd: z.coerce
    .number()
    .min(YEAR_MIN)
    .max(YEAR_MAX)
    .optional()
    .catch(undefined),
})
