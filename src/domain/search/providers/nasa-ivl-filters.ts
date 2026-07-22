import { z } from 'zod'

export const YEAR_MIN = 1920
export const YEAR_MAX = new Date().getFullYear()

function isOrderedYearRange(filters: { yearStart?: number; yearEnd?: number }) {
  return (
    filters.yearStart === undefined ||
    filters.yearEnd === undefined ||
    filters.yearStart <= filters.yearEnd
  )
}

export const nasaIvlSearchFiltersSchema = z
  .object({
    yearStart: z.coerce.number().min(YEAR_MIN).max(YEAR_MAX).optional(),
    yearEnd: z.coerce.number().min(YEAR_MIN).max(YEAR_MAX).optional(),
  })
  .refine(isOrderedYearRange, {
    message: 'yearStart must not be greater than yearEnd',
    path: ['yearStart'],
  })

export type NasaIvlSearchFilters = z.infer<typeof nasaIvlSearchFiltersSchema>

// URL-boundary variant: invalid values drop per key instead of failing the
// whole parse; an inverted year range drops as a pair.
export const nasaIvlSearchFiltersLenientSchema = z
  .object({
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
  .transform((filters) =>
    isOrderedYearRange(filters)
      ? filters
      : { ...filters, yearStart: undefined, yearEnd: undefined },
  )
