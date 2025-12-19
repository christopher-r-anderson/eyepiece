import { getAlbum } from '@/server/lib/nasa-images/client'
import { buildUrlSearchParamsMiddleware } from '@/server/lib/middleware'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eyepieceAlbumParamsSchema } from '@/lib/api/eyepiece/types'
import { mapMediaItem } from '@/server/lib/util'
import { calculateNasaAlbumRequests } from '@/server/lib/nasa-images/pagination'

export const DEFAULT_PAGE_SIZE = 20

export const Route = createFileRoute('/api/albums/$albumId')({
  server: {
    middleware: [buildUrlSearchParamsMiddleware(eyepieceAlbumParamsSchema)],
    handlers: {
      GET: async ({ params, context }) => {
        const pagination = {
          page: context.searchParams.page || 1,
          pageSize: context.searchParams.pageSize || DEFAULT_PAGE_SIZE,
        }
        // NASA Albums do not support page size, instead always returning 100 items per page
        // Therefore, we need to calculate which NASA album pages to fetch
        // and slice the results accordingly
        const plans = calculateNasaAlbumRequests(
          pagination.page,
          pagination.pageSize,
        )
        const responses = await Promise.all(
          plans.map((plan) => getAlbum(params.albumId, { page: plan.page })),
        )

        const total = responses[0].collection.metadata.total_hits
        const assets = []
        for (const [index, response] of responses.entries()) {
          const plan = plans[index]
          assets.push(
            ...response.collection.items
              .slice(plan.sliceStart, plan.sliceEnd)
              .map(mapMediaItem),
          )
        }
        const next =
          total > (pagination.page - 1) * pagination.pageSize + assets.length
            ? pagination.page + 1
            : undefined
        return json({
          assets,
          pagination: { next, total },
        })
      },
    },
  },
})
