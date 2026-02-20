import { createFileRoute } from '@tanstack/react-router'
import type { NasaMetadata } from '@/server/lib/nasa-images/types'
import { metadata } from '@/server/lib/nasa-images/client'
import { fromAssetKeyString } from '@/domain/asset/asset.util'
import { assetKeyStringSchema } from '@/domain/asset/asset.schemas'

export const DEFAULT_PAGE_SIZE = 24

export const Route = createFileRoute('/api/asset/$assetId/metadata')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const nasaResponse: NasaMetadata = await metadata(
          fromAssetKeyString(assetKeyStringSchema.parse(params.assetId))
            .externalId,
        )
        return Response.json(nasaResponse)
      },
    },
  },
})
