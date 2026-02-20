import { z } from 'zod'
import {
  assetKeySchema,
  assetProviderSchema,
  externalIdSchema,
} from '@/domain/asset/asset.schemas'

export const toggleFavoriteInputSchema = z.object({
  provider: assetProviderSchema,
  externalId: externalIdSchema,
})

export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteInputSchema>

export const toggleFavoriteResultSchema = z.object({
  assetSummaryId: z.uuid(),
  isFavorited: z.boolean(),
})

export type ToggleFavoriteResult = z.infer<typeof toggleFavoriteResultSchema>

export const favoriteEdgeSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  assetSummaryId: z.uuid(),
  assetKey: assetKeySchema,
})

export type FavoriteEdge = z.infer<typeof favoriteEdgeSchema>
