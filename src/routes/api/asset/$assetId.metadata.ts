import { metadata } from '@/server/lib/nasa-images/client'
import { NasaMetadata } from '@/server/lib/nasa-images/types'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const DEFAULT_PAGE_SIZE = 24

export const Route = createFileRoute('/api/asset/$assetId/metadata')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const nasaResponse: NasaMetadata = await metadata(params.assetId)
        return json(nasaResponse)
      },
    },
  },
})
