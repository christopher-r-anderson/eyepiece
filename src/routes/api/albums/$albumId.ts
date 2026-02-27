import { createFileRoute } from '@tanstack/react-router'
import { getAlbum } from '@/server/eyepiece/service/eyepiece.service'
import { buildUrlSearchParamsMiddleware } from '@/server/lib/middleware'
import {
  eyepieceApiAlbumParamsSchema,
  eyepiecePaginationSchema,
} from '@/lib/eyepiece-api-client/types'
import { fromAlbumKeyString } from '@/domain/album/album.util'
import { albumKeyStringSchema } from '@/domain/album/album.schemas'

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
        const albumKey = fromAlbumKeyString(
          albumKeyStringSchema.parse(params.albumId),
        )
        const albumResponse = await getAlbum(albumKey, pagination)
        return Response.json(albumResponse)
      },
    },
  },
})
