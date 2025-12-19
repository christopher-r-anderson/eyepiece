import { search } from '@/server/lib/nasa-images/client'
import { buildUrlSearchParamsMiddleware } from '@/server/lib/middleware'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  type EyepieceSearchParams,
  eyepieceSearchParamsSchema,
} from '@/lib/api/eyepiece/types'
import type { NasaSearchParams } from '@/server/lib/nasa-images/types'
import { mapMediaItem } from '@/server/lib/util'

export const DEFAULT_PAGE_SIZE = 20

export const Route = createFileRoute('/api/search')({
  server: {
    middleware: [buildUrlSearchParamsMiddleware(eyepieceSearchParamsSchema)],
    handlers: {
      GET: async ({ context }) => {
        const searchParams = {
          ...context.searchParams,
          page: context.searchParams.page || 1,
          pageSize: context.searchParams.pageSize || DEFAULT_PAGE_SIZE,
        }
        const nasaSearchParams = eyepieceToNasaSearchParams(searchParams)
        const nasaResponse = await search(nasaSearchParams)
        const assets = nasaResponse.collection.items.map(mapMediaItem)
        const total = nasaResponse.collection.metadata.total_hits
        const next =
          total > searchParams.pageSize * searchParams.page + assets.length
            ? searchParams.page + 1
            : undefined
        return json({
          assets,
          pagination: { next, total },
        })
      },
    },
  },
})

function eyepieceToNasaSearchParams(
  params: EyepieceSearchParams,
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
