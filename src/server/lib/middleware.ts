import { createMiddleware } from '@tanstack/react-start'
import z from 'zod'

export function buildUrlSearchParamsMiddleware<T extends z.ZodType>(schema: T) {
  return createMiddleware().server(async ({ next, request }) => {
    const url = new URL(request.url)
    const result = schema.safeParse(
      Object.fromEntries(url.searchParams.entries()),
    )

    if (!result.success) {
      return Response.json(
        { error: z.treeifyError(result.error) },
        { status: 400 },
      )
    }

    return next({
      context: {
        searchParams: result.data,
      },
    })
  })
}
