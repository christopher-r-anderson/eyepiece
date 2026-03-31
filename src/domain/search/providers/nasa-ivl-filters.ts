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
