import { createFileRoute } from '@tanstack/react-router'
import { buildUrlSearchParamsMiddleware } from '@/server/lib/middleware'
import { paginationSchema } from '@/domain/pagination/pagination.schema'
import { makeEyepieceProviderService } from '@/server/eyepiece/service'
import {
  createNotFoundResponse,
  createUnsupportedOperationResponse,
} from '@/server/lib/api-errors'
import {
  getHandledError,
  rethrowHandledErrorWithContext,
} from '@/server/lib/handled-errors'
import {
  parseOrThrowBadRequest,
  parseOrThrowProviderId,
} from '@/server/lib/utils'
import { externalAlbumIdSchema } from '@/domain/album/album.schema'
import { V1_ROUTE_PATHS } from '@/lib/api-paths'

const searchParamsMiddleware = buildUrlSearchParamsMiddleware(paginationSchema)

export const Route = createFileRoute('/api/v1/albums/$providerId/$albumId')({
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
          {
            code: 'INVALID_PATH_PARAMS',
            path: 'albumId',
          },
        )
        const service = makeEyepieceProviderService()
        let album

        try {
          album = await service.getAlbum(
            { providerId, externalId: albumId },
            pagination,
          )
        } catch (error) {
          if (
            getHandledError(error)?.code === 'UNSUPPORTED_PROVIDER_OPERATION'
          ) {
            return createUnsupportedOperationResponse(
              'Album lookup is not supported for this provider',
            )
          }

          rethrowHandledErrorWithContext(error, {
            tags: {
              'api.route': V1_ROUTE_PATHS.album,
              'http.method': 'GET',
            },
          })
        }

        if (!album) {
          return createNotFoundResponse('Album does not exist')
        }
        return Response.json(album)
      },
    },
  },
})
