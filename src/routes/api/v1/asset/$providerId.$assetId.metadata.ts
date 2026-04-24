import { createFileRoute } from '@tanstack/react-router'
import { makeEyepieceProviderService } from '@/server/eyepiece/service'
import {
  createNotFoundResponse,
  createUnsupportedOperationResponse,
} from '@/server/lib/api-errors'
import {
  getHandledError,
  rethrowHandledErrorWithContext,
} from '@/server/lib/handled-errors'
import { parseOrThrowProviderId } from '@/server/lib/utils'
import { V1_ROUTE_PATHS } from '@/lib/api-paths'

export const Route = createFileRoute(
  '/api/v1/asset/$providerId/$assetId/metadata',
)({
  server: {
    handlers: {
      GET: async ({ params: { providerId: providerIdString, assetId } }) => {
        const eyepiece = makeEyepieceProviderService()
        const providerId = parseOrThrowProviderId(providerIdString)
        let asset

        try {
          asset = await eyepiece.getMetadata({
            providerId,
            externalId: assetId,
          })
        } catch (error) {
          if (
            getHandledError(error)?.code === 'UNSUPPORTED_PROVIDER_OPERATION'
          ) {
            return createUnsupportedOperationResponse(
              'Asset metadata is not supported for this provider',
            )
          }

          rethrowHandledErrorWithContext(error, {
            tags: {
              'api.route': V1_ROUTE_PATHS.assetMetadata,
              'http.method': 'GET',
            },
          })
        }

        if (asset === null) {
          return createNotFoundResponse('Asset metadata does not exist')
        }

        return Response.json(asset)
      },
    },
  },
})
