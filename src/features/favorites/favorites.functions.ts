import { createServerFn } from '@tanstack/react-start'
import { ensurePublicAssetSummaryAndToggleUserFavorite } from './favorites.server'
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
      return ensurePublicAssetSummaryAndToggleUserFavorite(assetKey)
    },
  )
