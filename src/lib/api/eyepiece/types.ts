import { z } from 'zod'

export const YEAR_MIN = 1920
export const YEAR_MAX = new Date().getFullYear()

const eyepieceMediaSchema = z.enum(['image', 'video', 'audio'])

export type EyepieceMedia = z.infer<typeof eyepieceMediaSchema>

const eyepiecePaginationParamsSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
})

export type EyepiecePaginationParams = z.infer<typeof eyepiecePaginationParamsSchema>

export const eyepieceSearchParamsSchema = z.object({
  q: z.string().optional(),
  mediaType: eyepieceMediaSchema.optional(),
  yearStart: z.coerce.number().min(YEAR_MIN).max(YEAR_MAX).optional(),
  yearEnd: z.coerce.number().min(YEAR_MIN).max(YEAR_MAX).optional(),
  ...eyepiecePaginationParamsSchema.shape,
})

export interface EyepieceSearchParams extends z.infer<
  typeof eyepieceSearchParamsSchema
> {}

const eyepieceImageSchema = z.object({
  href: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
})

export const eyepieceAssetItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  albums: z.array(z.string()).optional(),
  photographer: z.string().optional(),
  image: eyepieceImageSchema.optional(),
  thumbnail: eyepieceImageSchema.optional(),
  original: eyepieceImageSchema.optional(),
  mediaType: eyepieceMediaSchema,
})

export interface EyepieceImageItem extends z.infer<
  typeof eyepieceAssetItemSchema
> {}

export const eyepieceAssetCollectionResponseSchema = z.object({
  assets: z.array(eyepieceAssetItemSchema),
  pagination: z.object({
    next: z.number().optional(),
    total: z.number(),
  }),
})

export interface EyepieceAssetCollectionResponse extends z.infer<
  typeof eyepieceAssetCollectionResponseSchema
> {}

export const eyepieceAlbumParamsSchema = z.object({
  ...eyepiecePaginationParamsSchema.shape,
})

export interface EyepieceAlbumParams extends z.infer<
  typeof eyepieceAlbumParamsSchema
> {}
