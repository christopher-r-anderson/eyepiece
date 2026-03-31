import { createFileRoute } from '@tanstack/react-router'
import { makeEyepieceProviderService } from '@/server/eyepiece/service'
import { parseOrThrowProviderId } from '@/server/lib/utils'

export const Route = createFileRoute('/api/asset/$providerId/$assetId')({
  server: {
    handlers: {
      GET: async ({ params: { providerId: providerIdString, assetId } }) => {
        const eyepiece = makeEyepieceProviderService()
        const providerId = parseOrThrowProviderId(providerIdString)
        const asset = await eyepiece.getAsset({
          providerId,
          externalId: assetId,
        })
        return Response.json(asset)
      },
    },
  },
})
