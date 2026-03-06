import { z } from 'zod'
import {
  PROVIDER_KEY_DELIMITER,
  providerSchema,
} from '../provider/provider.schema'
import { albumKeySchema } from '../album/album.schema'

export const externalAssetIdSchema = z.string().min(1)

export type ExternalAssetId = z.infer<typeof externalAssetIdSchema>

export const assetKeyStringSchema = z.templateLiteral([
  providerSchema,
  z.literal(PROVIDER_KEY_DELIMITER),
  externalAssetIdSchema,
])

export type AssetKeyString = z.infer<typeof assetKeyStringSchema>

export const assetKeySchema = z.object({
  provider: providerSchema,
  externalId: externalAssetIdSchema,
})

export type AssetKey = z.infer<typeof assetKeySchema>

export const imageSchema = z.object({
  href: z.url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

export type Image = z.infer<typeof imageSchema>

export const assetSummaryIdSchema = z.uuid()

export type AssetSummaryId = z.infer<typeof assetSummaryIdSchema>

export const assetSummarySchema = z.object({
  id: assetSummaryIdSchema,
  provider: providerSchema,
  externalId: externalAssetIdSchema,
  title: z.string(),
  thumbnail: imageSchema,
  albums: z.array(albumKeySchema).optional(),
})

export type AssetSummary = z.infer<typeof assetSummarySchema>
