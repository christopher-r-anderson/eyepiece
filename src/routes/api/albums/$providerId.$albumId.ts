import { createFileRoute } from '@tanstack/react-router'
import { buildUrlSearchParamsMiddleware } from '@/server/lib/middleware'
import { paginationSchema } from '@/domain/pagination/pagination.schema'
import { makeEyepieceProviderService } from '@/server/eyepiece/service'
import {
  parseOrThrowBadRequest,
  parseOrThrowProviderId,
} from '@/server/lib/utils'
import { externalAlbumIdSchema } from '@/domain/album/album.schema'

const searchParamsMiddleware = buildUrlSearchParamsMiddleware(paginationSchema)

export const Route = createFileRoute('/api/albums/$providerId/$albumId')({
  server: {
    middleware: [searchParamsMiddleware],
    handlers: {
      GET: async ({
        params: { providerId: providerIdString, albumId: albumIdString },
        context: { searchParams: pagination },
      }) => {
        const providerId = parseOrThrowProviderId(providerIdString)
        const albumId = parseOrThrowBadRequest(
          externalAlbumIdSchema,
          albumIdString,
          'Invalid albumId',
        )
        const service = makeEyepieceProviderService()
        const album = await service.getAlbum(
          { providerId, externalId: albumId },
          pagination,
        )
        if (!album) {
          return Response.json(
            { message: 'Album does not exist' },
            { status: 404 },
          )
        }
        return Response.json(album)
      },
    },
  },
})
