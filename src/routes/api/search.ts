import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { paginationSchema } from '@/domain/pagination/pagination.schema'
import { buildUrlSearchParamsMiddleware } from '@/server/lib/middleware'
import { makeEyepieceProviderService } from '@/server/eyepiece/service'
import {
  searchFiltersSchema,
  searchQuerySchema,
} from '@/domain/search/search.schema'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'
import { nasaIvlSearchFiltersSchema } from '@/domain/search/providers/nasa-ivl-filters'
import { sioaSearchFiltersSchema } from '@/domain/search/providers/si-oa-filters'

export const searchQueryParamSchema = z.object({
  q: searchQuerySchema,
})

export const searchFiltersParamsSchema = z.discriminatedUnion('providerId', [
  nasaIvlSearchFiltersSchema.extend({
    providerId: z.literal(NASA_IVL_PROVIDER_ID),
  }),
  sioaSearchFiltersSchema.extend({ providerId: z.literal(SI_OA_PROVIDER_ID) }),
])

const searchParamsMiddleware = buildUrlSearchParamsMiddleware(
  searchQueryParamSchema.and(paginationSchema).and(searchFiltersParamsSchema),
)

export const Route = createFileRoute('/api/search')({
  server: {
    middleware: [searchParamsMiddleware],
    handlers: {
      GET: async ({ context: { searchParams } }) => {
        const eyepiece = makeEyepieceProviderService()
        const { q } = searchQueryParamSchema.parse(searchParams)
        const pagination = paginationSchema.parse(searchParams)
        const filterParams = searchFiltersParamsSchema.parse(searchParams)
        const { providerId, ...providerFilters } = filterParams
        const filters = searchFiltersSchema.parse({
          providerId,
          filters: providerFilters,
        })
        const results = await eyepiece.searchAssets(q, filters, pagination)
        return Response.json(results)
      },
    },
  },
})
