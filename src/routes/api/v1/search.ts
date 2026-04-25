import { createFileRoute } from '@tanstack/react-router'
import { buildUrlSearchParamsMiddleware } from '@/server/lib/middleware'
import { makeEyepieceProviderService } from '@/server/eyepiece/service'
import { rethrowHandledErrorWithContext } from '@/server/lib/handled-errors'
import { parseOrThrowBadRequest } from '@/server/lib/utils'
import { searchFiltersSchema } from '@/domain/search/search.schema'
import { V1_ROUTE_PATHS } from '@/lib/api-paths'
import { searchRequestSchema } from '@/lib/eyepiece-api-contracts'

const searchParamsMiddleware =
  buildUrlSearchParamsMiddleware(searchRequestSchema)

const INVALID_SEARCH_PARAMS_MESSAGE =
  'One or more query parameters are invalid.'

export const Route = createFileRoute('/api/v1/search')({
  server: {
    middleware: [searchParamsMiddleware],
    handlers: {
      GET: async ({ context: { searchParams } }) => {
        const eyepiece = makeEyepieceProviderService()
        const parsedSearchParams = parseOrThrowBadRequest(
          searchRequestSchema,
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
