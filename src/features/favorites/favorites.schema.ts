import { z } from 'zod'
import { assetKeySchema } from '@/domain/asset/asset.schema'

export const toggleFavoriteResultSchema = z.object({
  assetPreviewSnapshotId: z.uuid(),
  isFavorited: z.boolean(),
})

export type ToggleFavoriteResult = z.infer<typeof toggleFavoriteResultSchema>

export const favoriteEdgeSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  assetPreviewSnapshotId: z.uuid(),
  assetKey: assetKeySchema,
})

export type FavoriteEdge = z.infer<typeof favoriteEdgeSchema>

// undo's re-favorite: restores the row with its original created_at (the
// favorites ordering key), instead of a fresh timestamp
export const refavoriteAtInputSchema = z.object({
  assetKey: assetKeySchema,
  createdAt: z.iso.datetime({ offset: true }),
})

export type RefavoriteAtInput = z.infer<typeof refavoriteAtInputSchema>
