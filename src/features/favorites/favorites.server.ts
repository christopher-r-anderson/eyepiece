import { createServerOnlyFn } from '@tanstack/react-start'
import { ToggleFavoriteErrorCodes } from './favorites.const'
import type { ToggleFavoriteErrorCode } from './favorites.const'
import type { ToggleFavoriteResult } from './favorites.schema'
import type {
  AssetKey,
  AssetPreviewSnapshotId,
} from '@/domain/asset/asset.schema'
import type { Result } from '@/lib/result'
import type { SupabaseClient } from '@/integrations/supabase/types'
import { createUserSupabaseClient } from '@/integrations/supabase/user'
import { getUser } from '@/features/auth/get-user'
import {
  expectedErrorObservability,
  operationalErrorObservability,
} from '@/lib/error-observability'
import { logErrorWithObservability } from '@/lib/error-logging'
import { Err, Ok, unwrapOrThrow } from '@/lib/result'
import { ensureAssetPreviewSnapshot } from '@/features/assets/asset-preview-snapshots.server'

// NOTE: server and client safe. if needed elsewhere it can be extracted to a shared module
async function toggleFavoriteForUser(
  client: SupabaseClient,
  userId: string,
  assetPreviewSnapshotId: AssetPreviewSnapshotId,
): Promise<Result<ToggleFavoriteResult, ToggleFavoriteErrorCode>> {
  const { count, error: deleteError } = await client
    .from('favorites')
    .delete({ count: 'exact' })
    .eq('owner_id', userId)
    .eq('asset_preview_snapshot_id', assetPreviewSnapshotId)

  if (deleteError) {
    const errorResult = {
      code: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
      message: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
      cause: deleteError,
      observability: operationalErrorObservability({
        tags: {
          feature: 'favorites',
          operation: 'toggle.delete',
        },
      }),
    }

    logErrorWithObservability('Favorite toggle delete failed', errorResult)

    return Err(errorResult)
  }

  if (count === 1) {
    return Ok({ assetPreviewSnapshotId, isFavorited: false })
  }

  // if nothing was deleted, insert
  const { error: insertError } = await client.from('favorites').insert({
    owner_id: userId,
    asset_preview_snapshot_id: assetPreviewSnapshotId,
  })

  // 23505 uniqueness violation, likely a double click race condition and not a practical issue
  if (insertError && insertError.code !== '23505') {
    const errorResult = {
      code: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
      message: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
      cause: insertError,
      observability: operationalErrorObservability({
        tags: {
          feature: 'favorites',
          operation: 'toggle.insert',
        },
      }),
    }

    logErrorWithObservability('Favorite toggle insert failed', errorResult)

    return Err(errorResult)
  }

  return Ok({ assetPreviewSnapshotId, isFavorited: true })
}

// NOTE: server and client safe. if needed elsewhere it can be extracted to a shared module
async function toggleUserFavorite(
  assetPreviewSnapshotId: AssetPreviewSnapshotId,
): Promise<Result<ToggleFavoriteResult, ToggleFavoriteErrorCode>> {
  const user = await getUser()
  if (!user) {
    return Err({
      code: ToggleFavoriteErrorCodes.AUTH_REQUIRED,
      message: ToggleFavoriteErrorCodes.AUTH_REQUIRED,
      observability: expectedErrorObservability({
        level: 'info',
        tags: {
          feature: 'favorites',
          operation: 'toggle.auth',
        },
      }),
    })
  }
  const userClient = createUserSupabaseClient()
  return toggleFavoriteForUser(userClient, user.id, assetPreviewSnapshotId)
}

// Exported for testing only
export const _internals = {
  toggleFavoriteForUser,
  toggleUserFavorite,
}

export const ensureSnapshotAndToggleUserFavorite = createServerOnlyFn(
  async (assetKey: AssetKey): Promise<ToggleFavoriteResult> => {
    const assetPreviewSnapshotId = unwrapOrThrow(
      await ensureAssetPreviewSnapshot(assetKey),
    )
    return unwrapOrThrow(await toggleUserFavorite(assetPreviewSnapshotId))
  },
)
