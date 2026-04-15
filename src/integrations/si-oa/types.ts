import { z } from 'zod'

// https://edan.si.edu/openaccess/apidocs/#api-search-search

export const sioaSearchParamsSchema = z.object({
  q: z.string(),
  start: z.number().optional(), // default 0
  rows: z.number().min(0).max(1000).optional(), // default: 10
  sort: z.enum(['relevancy', 'id', 'newest', 'updated', 'random']).optional(), // default: 'relevancy'
  type: z
    .enum(['edanmdm', 'ead_collection', 'ead_component', 'all'])
    .optional(), // default: 'edanmdm'
  row_group: z.enum(['objects', 'archives']).optional(), // default: 'objects'
  // api_key: z.string(), api_key is not used in provided type, but is required separately in client functions
})

export type SioaSearchParams = z.infer<typeof sioaSearchParamsSchema>

export const sioaResourceItemSchema = z.object({
  url: z.url(),
  label: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  dimensions: z.string().optional(),
})

export type SioaResourceItem = z.infer<typeof sioaResourceItemSchema>

export const sioaMediaItemSchema = z.object({
  resources: z.array(sioaResourceItemSchema),
})

export type SioaMediaItem = z.infer<typeof sioaMediaItemSchema>

const createCollectionSchema = <T extends z.ZodTypeAny>(itemDataSchema: T) =>
  z.object({
    status: z.number(),
    responseCode: z.number(),
    response: z.object({
      facets: z.record(z.string(), z.string()),
      rowCount: z.number(),
      message: z.string(),
      rows: z.array(itemDataSchema),
    }),
  })

export const sioaAssetItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  unitCode: z.string(),
  type: z.string(),
  url: z.string(), // not a web style url
  content: z.object({
    descriptiveNonRepeating: z.object({
      guid: z.string().optional(),
      title: z.object({ label: z.string(), content: z.string() }),
      record_ID: z.string(),
      unit_code: z.string(),
      title_sort: z.string().optional(),
      data_source: z.string(),
      record_link: z.url().optional(),
      online_media: z
        .object({
          media: z.array(sioaMediaItemSchema),
          mediaCount: z.number(),
        })
        .optional(),
      metadata_usage: z.object({
        access: z.string(),
      }),
    }),
  }),
  hash: z.string(),
  docSignature: z.string(),
  timestamp: z.coerce.number().optional(),
  lastTimeUpdated: z.coerce.number().optional(),
  version: z.coerce.number().optional(), // maybe leave as number?
})

export type SioaAssetItem = z.infer<typeof sioaAssetItemSchema>

export const sioaAssetItemResponseSchema = z.object({
  status: z.number(),
  responseCode: z.number(),
  response: sioaAssetItemSchema,
})

export const sioaAssetCollectionResponseSchema =
  createCollectionSchema(sioaAssetItemSchema)

export type SioaAssetCollectionResponse = z.infer<
  typeof sioaAssetCollectionResponseSchema
>

export const sioaMetadataSchema = z.record(z.string(), z.any())

export type SioaMetadata = z.infer<typeof sioaMetadataSchema>
