import { createFileRoute } from '@tanstack/react-router'
import { makeEyepieceProviderService } from '@/server/eyepiece/service'
import { createNotFoundResponse } from '@/server/lib/api-errors'
import { rethrowHandledErrorWithContext } from '@/server/lib/handled-errors'
import { parseOrThrowProviderId } from '@/server/lib/utils'

export const Route = createFileRoute('/api/asset/$providerId/$assetId')({
  server: {
    handlers: {
      GET: async ({ params: { providerId: providerIdString, assetId } }) => {
        const eyepiece = makeEyepieceProviderService()
        const providerId = parseOrThrowProviderId(providerIdString)
        let asset

        try {
          asset = await eyepiece.getAsset({
            providerId,
            externalId: assetId,
          })
        } catch (error) {
          rethrowHandledErrorWithContext(error, {
            tags: {
              'api.route': '/api/asset/$providerId/$assetId',
              'http.method': 'GET',
            },
          })
        }

        if (!asset) {
          return createNotFoundResponse('Asset does not exist')
        }

        return Response.json(asset)
      },
    },
  },
})
