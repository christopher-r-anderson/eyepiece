import { z } from 'zod'

export const DEFAULT_PAGE_SIZE = 24
export const DEFAULT_PAGE = 1
export const YEAR_MIN = 1920
export const YEAR_MAX = new Date().getFullYear()

const eyepieceMediaSchema = z.enum(['image', 'video', 'audio'])

export type EyepieceMedia = z.infer<typeof eyepieceMediaSchema>

export const eyepiecePaginationSchema = z.object({
  page: z.coerce.number().min(1).default(DEFAULT_PAGE),
  pageSize: z.coerce.number().min(1).max(100).default(DEFAULT_PAGE_SIZE),
})

export type EyepiecePagination = z.infer<typeof eyepiecePaginationSchema>

export const eyepiecePaginationParamsSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
})

export type EyepiecePaginationParams = z.infer<
  typeof eyepiecePaginationParamsSchema
>

const eyepieceCoreSearchParamsSchema = z.object({
  q: z.string().optional(),
  mediaType: eyepieceMediaSchema.optional(),
  yearStart: z.coerce.number().min(YEAR_MIN).max(YEAR_MAX).optional(),
  yearEnd: z.coerce.number().min(YEAR_MIN).max(YEAR_MAX).optional(),
})

export const eyepiecePageSearchParamsSchema = eyepieceCoreSearchParamsSchema

export type EyepiecePageSearchParams = z.infer<
  typeof eyepiecePageSearchParamsSchema
>

export const eyepieceApiSearchParamsSchema =
  eyepieceCoreSearchParamsSchema.extend({
    ...eyepiecePaginationParamsSchema.shape,
  })

export type EyepieceApiSearchParams = z.infer<
  typeof eyepieceApiSearchParamsSchema
>

export const eyepieceMetadataSchema = z.record(z.string(), z.any())

export type EyepieceMetadata = z.infer<typeof eyepieceMetadataSchema>

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

export type EyepieceAssetItem = z.infer<typeof eyepieceAssetItemSchema>

export const eyepieceAssetResponseSchema = eyepieceAssetItemSchema

export type EyepieceAssetResponse = z.infer<typeof eyepieceAssetResponseSchema>

export const eyepieceAssetCollectionResponseSchema = z.object({
  assets: z.array(eyepieceAssetItemSchema),
  pagination: z.object({
    next: z.number().optional(),
    total: z.number(),
  }),
})

export type EyepieceAssetCollectionResponse = z.infer<
  typeof eyepieceAssetCollectionResponseSchema
>

const eyepieceCoreAlbumParamsSchema = z.object({})

export const eyepieceApiAlbumParamsSchema =
  eyepieceCoreAlbumParamsSchema.extend({
    ...eyepiecePaginationParamsSchema.shape,
  })

export type EyepieceApiAlbumParams = z.infer<
  typeof eyepieceApiAlbumParamsSchema
>
