import { z } from 'zod'

export const ASSET_PROVIDERS = ['nasa_ivl'] as const
export const NASA_IVL_PROVIDER: AssetProvider = ASSET_PROVIDERS[0]
export const ASSET_KEY_DELIMITER = '-' as const

export const assetProviderSchema = z.enum(ASSET_PROVIDERS)

export type AssetProvider = z.infer<typeof assetProviderSchema>

export const externalIdSchema = z.string().min(1)

export type ExternalId = z.infer<typeof externalIdSchema>

export const assetKeyStringSchema = z.templateLiteral([
  assetProviderSchema,
  z.literal(ASSET_KEY_DELIMITER),
  externalIdSchema,
])

export type AssetKeyString = z.infer<typeof assetKeyStringSchema>

export const assetKeySchema = z.object({
  provider: assetProviderSchema,
  externalId: externalIdSchema,
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
  provider: assetProviderSchema,
  externalId: externalIdSchema,
  title: z.string(),
  thumbnail: imageSchema,
  // TODO: extract to album feature
  albums: z.array(z.string()).optional(),
})

export type AssetSummary = z.infer<typeof assetSummarySchema>
