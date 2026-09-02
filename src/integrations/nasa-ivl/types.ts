import { z } from 'zod'

const YEAR_MIN = 1920
const YEAR_MAX = new Date().getFullYear()

const nasaMediaSchema = z.enum(['image', 'video', 'audio'])
const commaListTransform = (val: string) => val.split(',').map((s) => s.trim())

const nasaSearchParamsSchema = z.object({
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

export type NasaSearchParams = z.infer<typeof nasaSearchParamsSchema>

const nasaMediaLinkSchema = z.object({
  href: z.url(),
  rel: z.string(),
  render: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  // bytes, and the only signal that separates a servable original from a
  // hundred-megabyte one
  size: z.number().optional(),
})

export type NasaMediaLink = z.infer<typeof nasaMediaLinkSchema>

const collectionLinkSchema = z.object({
  rel: z.string(),
  href: z.url(),
  prompt: z.string(),
})

const createCollectionSchema = <T extends z.ZodTypeAny>(itemDataSchema: T) =>
  z.object({
    collection: z.object({
      version: z.string(),
      href: z.url(),
      links: z.array(collectionLinkSchema).optional(),
      items: z.array(
        z.object({
          href: z.url(),
          // data always carries exactly one entry; enforce the floor only,
          // since rejecting extra entries would turn a harmless upstream
          // addition into a provider outage
          data: z.array(itemDataSchema).min(1),
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
  description: z.string().optional(),
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

export const nasaMetadataSchema = z.record(z.string(), z.any())

const nasaAlbumParamsSchema = z.object({
  page: z.number().min(1).optional(),
})

export type NasaAlbumParams = z.infer<typeof nasaAlbumParamsSchema>
