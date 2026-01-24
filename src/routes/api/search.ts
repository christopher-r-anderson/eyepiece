import { createFileRoute } from '@tanstack/react-router'
import { calculateNextPage } from './-util'
import type { NasaSearchParams } from '@/server/lib/nasa-images/types'
import type {
  EyepieceApiSearchParams,
  EyepieceAssetCollectionResponse,
} from '@/lib/api/eyepiece/types'
import {
  eyepieceApiSearchParamsSchema,
  eyepiecePaginationSchema,
} from '@/lib/api/eyepiece/types'
import { search } from '@/server/lib/nasa-images/client'
import { mapMediaItem } from '@/server/lib/util'
import { buildUrlSearchParamsMiddleware } from '@/server/lib/middleware'

export const Route = createFileRoute('/api/search')({
  server: {
    middleware: [buildUrlSearchParamsMiddleware(eyepieceApiSearchParamsSchema)],
    handlers: {
      GET: async ({ context: { searchParams } }) => {
        const pagination = eyepiecePaginationSchema.parse({
          page: searchParams.page,
          pageSize: searchParams.pageSize,
        })
        const nasaSearchParams = eyepieceToNasaSearchParams(searchParams)
        const nasaResponse = await search(nasaSearchParams)
        const assets = nasaResponse.collection.items.map(mapMediaItem)
        const total = nasaResponse.collection.metadata.total_hits
        const next = calculateNextPage(pagination, assets.length, total)
        const response: EyepieceAssetCollectionResponse = {
          assets,
          pagination: { next, total },
        }
        return Response.json(response)
      },
    },
  },
})

function eyepieceToNasaSearchParams(
  params: EyepieceApiSearchParams,
): NasaSearchParams {
  const { q, mediaType, page, pageSize, yearStart, yearEnd } = params
  return {
    q,
    media_type: mediaType ? [mediaType] : undefined,
    year_start: yearStart,
    year_end: yearEnd,
    page,
    page_size: pageSize,
  }
}
