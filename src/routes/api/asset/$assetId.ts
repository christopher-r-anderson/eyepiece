import { search } from '@/server/lib/nasa-images/client'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { mapMediaItem } from '@/server/lib/util'
import { EyepieceAssetResponse } from '@/lib/api/eyepiece/types'

export const DEFAULT_PAGE_SIZE = 24

export const Route = createFileRoute('/api/asset/$assetId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        // NOTE: use search + nasa_id because the only other "detail" endpoint is the
        // metadata.json file which contains a lot of duplicate and extraneous data
        const nasaResponse = await search({ nasa_id: params.assetId })
        if (nasaResponse.collection.items.length !== 1) {
          throw new Error('Asset not found')
        }
        const item = nasaResponse.collection.items[0]
        const response: EyepieceAssetResponse = mapMediaItem(item)
        return json(response)
      },
    },
  },
})
