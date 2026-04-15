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

export const imageSchema = z.object({
  href: z.url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

export type Image = z.infer<typeof imageSchema>

const assetCommonSchema = z.object({
  key: assetKeySchema,
  title: z.string(),
  thumbnail: imageSchema,
  albums: z.array(albumKeySchema).optional(),
})

export const assetSchema = assetCommonSchema.extend({
  description: z.string(),
  image: imageSchema,
  original: imageSchema,
  alt: z.string().optional(),
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
