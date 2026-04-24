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
): z.ZodObject<{
  items: z.ZodArray<z.ZodType<TItem>>
  pagination: z.ZodObject<{
    next: z.ZodNullable<z.ZodNumber>
    total: z.ZodNumber
  }>
}>
export function createPaginatedCollectionSchema<TItem, TCollection>(
  itemSchema: z.ZodType<TItem>,
  collectionSchema: z.ZodType<TCollection>,
): z.ZodObject<{
  items: z.ZodArray<z.ZodType<TItem>>
  pagination: z.ZodObject<{
    next: z.ZodNullable<z.ZodNumber>
    total: z.ZodNumber
  }>
  collection: z.ZodOptional<z.ZodType<TCollection>>
}>
export function createPaginatedCollectionSchema<TItem, TCollection>(
  itemSchema: z.ZodType<TItem>,
  collectionSchema?: z.ZodType<TCollection>,
) {
  const base = z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      next: z.number().nullable(),
      total: z.number(),
    }),
  })
  if (collectionSchema) {
    return base.extend({ collection: collectionSchema.optional() })
  }
  return base
}

export type PaginatedCollection<TItem, TCollection = never> = {
  items: Array<TItem>
  pagination: { next: number | null; total: number }
} & ([TCollection] extends [never] ? object : { collection?: TCollection })
