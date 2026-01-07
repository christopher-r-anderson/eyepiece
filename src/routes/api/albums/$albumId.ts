import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { calculateNextPage } from '../-util'
import type { EyepieceAssetCollectionResponse } from '@/lib/api/eyepiece/types'
import { getAlbum } from '@/server/lib/nasa-images/client'
import { mapMediaItem } from '@/server/lib/util'
import { buildUrlSearchParamsMiddleware } from '@/server/lib/middleware'
import {
  eyepieceApiAlbumParamsSchema,
  eyepiecePaginationSchema,
} from '@/lib/api/eyepiece/types'
import { calculateNasaAlbumRequests } from '@/server/lib/nasa-images/pagination'

export const DEFAULT_PAGE_SIZE = 24

export const Route = createFileRoute('/api/albums/$albumId')({
  server: {
    middleware: [buildUrlSearchParamsMiddleware(eyepieceApiAlbumParamsSchema)],
    handlers: {
      GET: async ({ params, context }) => {
        const pagination = eyepiecePaginationSchema.parse({
          page: context.searchParams.page,
          pageSize: context.searchParams.pageSize,
        })
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
        const next = calculateNextPage(pagination, assets.length, total)
        const response: EyepieceAssetCollectionResponse = {
          assets,
          pagination: { next, total },
        }
        return json(response)
      },
    },
  },
})
