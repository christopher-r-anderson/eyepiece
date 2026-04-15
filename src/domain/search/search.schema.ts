import { z } from 'zod'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '../provider/provider.schema'
import { nasaIvlSearchFiltersSchema } from './providers/nasa-ivl-filters'
import { sioaSearchFiltersSchema } from './providers/si-oa-filters'

export const searchQuerySchema = z.string()

export type SearchQuery = z.infer<typeof searchQuerySchema>

export const searchFiltersSchema = z.discriminatedUnion('providerId', [
  z.object({
    providerId: z.literal(NASA_IVL_PROVIDER_ID),
    filters: nasaIvlSearchFiltersSchema.strict(),
  }),
  z.object({
    providerId: z.literal(SI_OA_PROVIDER_ID),
    filters: sioaSearchFiltersSchema.strict(),
  }),
])

export type SearchFilters = z.infer<typeof searchFiltersSchema>
