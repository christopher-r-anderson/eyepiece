import { createFileRoute } from '@tanstack/react-router'
import {
  eyepieceApiSearchParamsSchema,
  eyepiecePaginationSchema,
} from '@/lib/eyepiece-api-client/types'
import { search } from '@/server/eyepiece/service/eyepiece.service'
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
        const results = await search(searchParams, pagination)
        return Response.json(results)
      },
    },
  },
})
