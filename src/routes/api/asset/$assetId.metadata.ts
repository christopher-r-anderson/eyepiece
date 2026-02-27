import { createFileRoute } from '@tanstack/react-router'
import { getMetadata } from '@/server/eyepiece/service/eyepiece.service'
import { fromAssetKeyString } from '@/domain/asset/asset.util'
import { assetKeyStringSchema } from '@/domain/asset/asset.schemas'

export const DEFAULT_PAGE_SIZE = 24

export const Route = createFileRoute('/api/asset/$assetId/metadata')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const assetKey = fromAssetKeyString(
          assetKeyStringSchema.parse(params.assetId),
        )
        const metadata = await getMetadata(assetKey)
        return Response.json(metadata)
      },
    },
  },
})
