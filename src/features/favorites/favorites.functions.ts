import { createServerFn } from '@tanstack/react-start'
import {
  ensureSnapshotAndToggleUserFavorite,
  refavoriteUserFavoriteAt,
  unfavoriteUserFavorite,
} from './favorites.server'
import { refavoriteAtInputSchema } from './favorites.schema'
import type { ToggleFavoriteResult } from './favorites.schema'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { assetKeySchema } from '@/domain/asset/asset.schema'

export const toggleFavorite = createServerFn({ method: 'POST' })
  .inputValidator(assetKeySchema)
  .handler(
    async ({
      data: assetKey,
    }: {
      data: AssetKey
    }): Promise<ToggleFavoriteResult> => {
      return ensureSnapshotAndToggleUserFavorite(assetKey)
    },
  )

export const refavoriteAt = createServerFn({ method: 'POST' })
  .inputValidator(refavoriteAtInputSchema)
  .handler(async ({ data }): Promise<ToggleFavoriteResult> => {
    return refavoriteUserFavoriteAt(data)
  })

export const unfavorite = createServerFn({ method: 'POST' })
  .inputValidator(assetKeySchema)
  .handler(async ({ data }): Promise<{ removed: boolean }> => {
    return unfavoriteUserFavorite(data)
  })
