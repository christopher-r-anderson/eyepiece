import { z } from 'zod'
import {
  PROVIDER_KEY_DELIMITER,
  providerIdSchema,
} from '../provider/provider.schema'
import { albumKeySchema } from '../album/album.schema'

export const externalAssetIdSchema = z.string().min(1)

export type ExternalAssetId = z.infer<typeof externalAssetIdSchema>

export const assetKeyStringSchema = z.templateLiteral([
  providerIdSchema,
  z.literal(PROVIDER_KEY_DELIMITER),
  externalAssetIdSchema,
])

export type AssetKeyString = z.infer<typeof assetKeyStringSchema>

export const assetKeySchema = z.object({
  providerId: providerIdSchema,
  externalId: externalAssetIdSchema,
})

export type AssetKey = z.infer<typeof assetKeySchema>

export const renditionSchema = z.object({
  href: z.url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

export type Rendition = z.infer<typeof renditionSchema>

export const assetImageSchema = z.object({
  // the master's dimensions: every surface lays out on this aspect ratio,
  // whichever rendition it ends up fetching
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  // widest first, and only files a browser decodes
  renditions: z.array(renditionSchema).nonempty(),
})

export type AssetImage = z.infer<typeof assetImageSchema>

const assetCommonSchema = z.object({
  key: assetKeySchema,
  title: z.string(),
  // absent when the provider supplied no file we can render. Rare, and a
  // fabricated placeholder would be a dimension the layout then believes.
  image: assetImageSchema.optional(),
  albums: z.array(albumKeySchema).optional(),
})

export const assetSchema = assetCommonSchema.extend({
  description: z.string().optional(),
  // present only when the provider supplied a real text alternative
  alt: z.string().optional(),
  // the record's page at the provider, not the image file
  sourceUrl: z.url().optional(),
})

export type Asset = z.infer<typeof assetSchema>

export const assetPreviewSnapshotIdSchema = z.uuid()

export type AssetPreviewSnapshotId = z.infer<
  typeof assetPreviewSnapshotIdSchema
>

export const assetPreviewSchema = assetCommonSchema

export type AssetPreview = z.infer<typeof assetPreviewSchema>

export const assetPreviewSnapshotSchema = assetPreviewSchema.extend({
  id: assetPreviewSnapshotIdSchema,
})

export type AssetPreviewSnapshot = z.infer<typeof assetPreviewSnapshotSchema>

export const metadataSchema = z.record(z.string(), z.unknown())

export type Metadata = z.infer<typeof metadataSchema>
