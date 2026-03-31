import { z } from 'zod'

export const sioaSearchFiltersSchema = z.object({})

export type SioaSearchFilters = z.infer<typeof sioaSearchFiltersSchema>
