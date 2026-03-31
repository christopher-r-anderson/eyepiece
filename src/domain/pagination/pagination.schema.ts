import { z } from 'zod'

export const DEFAULT_PAGE_SIZE = 24
const DEFAULT_PAGE = 1

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(DEFAULT_PAGE),
  pageSize: z.coerce.number().min(1).max(100).default(DEFAULT_PAGE_SIZE),
})

export type Pagination = z.infer<typeof paginationSchema>

export function paginateSchema<T extends z.ZodRawShape>(
  paramsSchema: z.ZodObject<T>,
) {
  return paramsSchema.extend({
    ...paginationSchema.shape,
  })
}

export function createPaginatedCollectionSchema<TItem>(
  itemSchema: z.ZodType<TItem>,
) {
  return z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      next: z.number().nullable(),
      total: z.number(),
    }),
  })
}

export type PaginatedCollection<TItem> = z.infer<
  ReturnType<typeof createPaginatedCollectionSchema<TItem>>
>
