import { z } from 'zod'

export const YEAR_MIN = 1920
export const YEAR_MAX = new Date().getFullYear()

const nasaMediaSchema = z.enum(['image', 'video', 'audio'])
const commaListTransform = (val: string) => val.split(',').map((s) => s.trim())

export const nasaSearchParamsSchema = z.object({
  q: z.string().optional(),
  center: z.string().optional(),
  description: z.string().optional(),
  description_508: z.string().optional(),
  keywords: z.string().transform(commaListTransform).optional(),
  location: z.string().optional(),
  media_type: z
    .string()
    .transform(commaListTransform)
    .pipe(z.array(nasaMediaSchema))
    .optional(),
  nasa_id: z.string().optional(),
  page: z.number().min(1).optional(),
  page_size: z.number().min(1).optional(),
  photographer: z.string().optional(),
  secondary_creator: z.string().optional(),
  title: z.string().optional(),
  year_start: z.coerce.number().min(YEAR_MIN).max(YEAR_MAX).optional(),
  year_end: z.coerce.number().min(YEAR_MIN).max(YEAR_MAX).optional(),
})

export interface NasaSearchParams extends z.infer<
  typeof nasaSearchParamsSchema
> {}

export const nasaMediaLinkSchema = z.object({
  href: z.url(),
  rel: z.string(),
  render: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
})

export interface NasaMediaLink extends z.infer<typeof nasaMediaLinkSchema> {}

const collectionLinkSchema = z.object({
  rel: z.string(),
  href: z.url(),
  prompt: z.string(),
})

export interface NasaCollectionLink extends z.infer<
  typeof collectionLinkSchema
> {}

const createCollectionSchema = <T extends z.ZodTypeAny>(itemDataSchema: T) =>
  z.object({
    collection: z.object({
      version: z.string(),
      href: z.url(),
      links: z.array(collectionLinkSchema).optional(),
      items: z.array(
        z.object({
          href: z.url(),
          // Note data is an array but is always .length === 1
          data: z.array(itemDataSchema),
          links: z.array(nasaMediaLinkSchema),
        }),
      ),
      metadata: z.object({
        total_hits: z.number(),
      }),
    }),
  })

const nasaMediaItemSchema = z.object({
  center: z.string(),
  date_created: z.iso.datetime(),
  description: z.string(),
  keywords: z.array(z.string()).optional(),
  media_type: nasaMediaSchema,
  nasa_id: z.string(),
  title: z.string(),
  album: z.array(z.string()).optional(),
  photographer: z.string().optional(),
})

export type NasaMediaItem = z.infer<typeof nasaMediaItemSchema>

export const nasaMediaCollectionResponseSchema =
  createCollectionSchema(nasaMediaItemSchema)

export type NasaMediaCollectionResponse = z.infer<
  typeof nasaMediaCollectionResponseSchema
>

export const nasaAlbumParamsSchema = z.object({
  page: z.number().min(1).optional(),
})

export interface NasaAlbumParams extends z.infer<
  typeof nasaAlbumParamsSchema
> {}
