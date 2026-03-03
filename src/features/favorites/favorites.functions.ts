import { createServerFn } from '@tanstack/react-start'
import { ensurePublicAssetSummaryAndToggleUserFavorite } from './favorites.server'
import type { ToggleFavoriteResult } from './favorites.schemas'
import type { AssetKey } from '@/domain/asset/asset.schemas'
import { assetKeySchema } from '@/domain/asset/asset.schemas'

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
