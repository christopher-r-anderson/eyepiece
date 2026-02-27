import { createFileRoute } from '@tanstack/react-router'
import { getAsset } from '@/server/eyepiece/service/eyepiece.service'
import { assetKeyStringSchema } from '@/domain/asset/asset.schemas'
import { fromAssetKeyString } from '@/domain/asset/asset.util'

export const DEFAULT_PAGE_SIZE = 24

export const Route = createFileRoute('/api/asset/$assetId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const assetKey = fromAssetKeyString(
          assetKeyStringSchema.parse(params.assetId),
        )
        const asset = await getAsset(assetKey)
        return Response.json(asset)
      },
    },
  },
})
