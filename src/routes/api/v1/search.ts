import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { paginationSchema } from '@/domain/pagination/pagination.schema'
import { buildUrlSearchParamsMiddleware } from '@/server/lib/middleware'
import { makeEyepieceProviderService } from '@/server/eyepiece/service'
import { rethrowHandledErrorWithContext } from '@/server/lib/handled-errors'
import { parseOrThrowBadRequest } from '@/server/lib/utils'
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
import { V1_ROUTE_PATHS } from '@/lib/api-paths'

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

const INVALID_SEARCH_PARAMS_MESSAGE =
  'One or more query parameters are invalid.'

export const Route = createFileRoute('/api/v1/search')({
  server: {
    middleware: [searchParamsMiddleware],
    handlers: {
      GET: async ({ context: { searchParams } }) => {
        const eyepiece = makeEyepieceProviderService()
        const parsedSearchParams = parseOrThrowBadRequest(
          searchQueryParamSchema
            .and(paginationSchema)
            .and(searchFiltersParamsSchema),
          searchParams,
          INVALID_SEARCH_PARAMS_MESSAGE,
          {
            code: 'INVALID_QUERY_PARAMS',
          },
        )
        const { q, page, pageSize, providerId, ...providerFilters } =
          parsedSearchParams
        const filters = parseOrThrowBadRequest(
          searchFiltersSchema,
          {
            providerId,
            filters: providerFilters,
          },
          INVALID_SEARCH_PARAMS_MESSAGE,
          {
            code: 'INVALID_QUERY_PARAMS',
          },
        )

        let results

        try {
          results = await eyepiece.searchAssets(q, filters, { page, pageSize })
        } catch (error) {
          rethrowHandledErrorWithContext(error, {
            tags: {
              'api.route': V1_ROUTE_PATHS.search,
              'http.method': 'GET',
            },
          })
        }

        return Response.json(results)
      },
    },
  },
})
