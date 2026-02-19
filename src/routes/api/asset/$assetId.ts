import { createFileRoute } from '@tanstack/react-router'
import type { EyepieceAssetResponse } from '@/lib/api/eyepiece/types'
import { search } from '@/server/lib/nasa-images/client'
import { mapMediaItem } from '@/server/lib/util'
import { assetKeyStringSchema } from '@/domain/asset/asset.schemas'
import { fromAssetKeyString } from '@/domain/asset/asset.util'

export const DEFAULT_PAGE_SIZE = 24

export const Route = createFileRoute('/api/asset/$assetId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        // NOTE: use search + nasa_id because the only other "detail" endpoint is the
        // metadata.json file which contains a lot of duplicate and extraneous data
        // It does contain line breaks in descriptions, which we are currently opting to do without
        const { externalId: nasa_id } = fromAssetKeyString(
          assetKeyStringSchema.parse(params.assetId),
        )
        const nasaResponse = await search({
          nasa_id,
        })
        if (nasaResponse.collection.items.length !== 1) {
          throw new Error(`Asset not found: ${nasa_id}`)
        }
        const item = nasaResponse.collection.items[0]
        const response: EyepieceAssetResponse = mapMediaItem(item)
        return Response.json(response)
      },
    },
  },
})
