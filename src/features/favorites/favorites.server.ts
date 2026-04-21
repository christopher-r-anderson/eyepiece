import { createServerOnlyFn } from '@tanstack/react-start'
import {
  ASSET_PREVIEW_SNAPSHOT_STALE_TIME,
  ToggleFavoriteErrorCodes,
} from './favorites.const'
import type { ToggleFavoriteErrorCode } from './favorites.const'
import type { ToggleFavoriteResult } from './favorites.schema'
import type {
  AssetKey,
  AssetPreviewSnapshotId,
} from '@/domain/asset/asset.schema'
import type { Result } from '@/lib/result'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import { createServiceSupabaseClient } from '@/integrations/supabase/service'
import { createEyepieceClient } from '@/lib/eyepiece-api-client/client'
import { createUserSupabaseClient } from '@/integrations/supabase/user'
import { getUser } from '@/features/auth/get-user'
import {
  expectedErrorObservability,
  operationalErrorObservability,
} from '@/lib/error-observability'
import { logErrorWithObservability } from '@/lib/error-logging'
import { Err, Ok, unwrapOrThrow } from '@/lib/result'
import { getOrigin } from '@/lib/utils'

// NOTE: server and client safe. if needed elsewhere it can be extracted to a shared module
async function toggleFavoriteForUser(
  client: SupabaseClient,
  userId: string,
  assetSummaryId: AssetPreviewSnapshotId,
): Promise<Result<ToggleFavoriteResult, ToggleFavoriteErrorCode>> {
  const { count, error: deleteError } = await client
    .from('favorites')
    .delete({ count: 'exact' })
    .eq('owner_id', userId)
    .eq('asset_preview_snapshot_id', assetSummaryId)

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
    return Ok({ assetSummaryId, isFavorited: false })
  }

  // if nothing was deleted, insert
  const { error: insertError } = await client.from('favorites').insert({
    owner_id: userId,
    asset_preview_snapshot_id: assetSummaryId,
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

  return Ok({ assetSummaryId, isFavorited: true })
}

// NOTE: server and client safe. if needed elsewhere it can be extracted to a shared module
async function toggleUserFavorite(
  assetSummaryId: AssetPreviewSnapshotId,
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
  return toggleFavoriteForUser(userClient, user.id, assetSummaryId)
}

// Internal implementation extracted for unit testing only because it uses a service client
// **do NOT call directly**, instead use `ensurePublicAssetSummary` which is guarded
async function _ensurePublicAssetSummaryForKey(
  serviceClient: SupabaseClient,
  eyepieceClient: EyepieceClient,
  assetKey: AssetKey,
): Promise<Result<AssetPreviewSnapshotId, ToggleFavoriteErrorCode>> {
  let assetSummaryId

  const { data: currentAssetSummary, error: currentAssetSummaryError } =
    await serviceClient
      .from('asset_preview_snapshots')
      .select('id, updated_at')
      .eq('provider_id', assetKey.providerId)
      .eq('external_id', assetKey.externalId)
      .maybeSingle()

  if (currentAssetSummaryError) {
    const errorResult = {
      code: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
      message: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
      cause: currentAssetSummaryError,
      observability: operationalErrorObservability({
        tags: {
          feature: 'favorites',
          operation: 'asset-summary.lookup',
          'provider.id': assetKey.providerId,
        },
      }),
    }

    logErrorWithObservability(
      'Favorite asset summary lookup failed',
      errorResult,
    )

    return Err(errorResult)
  }
  if (currentAssetSummary) {
    const assetUpdatedAt = new Date(currentAssetSummary.updated_at)
    if (
      Date.now() - assetUpdatedAt.getTime() <
      ASSET_PREVIEW_SNAPSHOT_STALE_TIME
    ) {
      assetSummaryId = currentAssetSummary.id
    }
  }

  if (!assetSummaryId) {
    let asset
    try {
      asset = await eyepieceClient.getAsset(assetKey)
    } catch (error) {
      const errorResult = {
        code: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
        message: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
        cause: error,
        observability: operationalErrorObservability({
          tags: {
            feature: 'favorites',
            operation: 'asset-summary.fetch-asset',
            'provider.id': assetKey.providerId,
          },
        }),
      }

      logErrorWithObservability('Favorite asset fetch failed', errorResult)

      return Err(errorResult)
    }
    const { data: ensuredAssetSummaryId, error: ensureImageRefError } =
      await serviceClient.rpc('ensure_asset_preview_snapshot', {
        p_provider_id: assetKey.providerId,
        p_external_id: assetKey.externalId,
        p_title: asset.title,
        p_thumb_href: asset.thumbnail.href,
        p_thumb_width: asset.thumbnail.width,
        p_thumb_height: asset.thumbnail.height,
      })
    if (ensureImageRefError) {
      const errorResult = {
        code: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
        message: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
        cause: ensureImageRefError,
        observability: operationalErrorObservability({
          tags: {
            feature: 'favorites',
            operation: 'asset-summary.ensure-snapshot',
            'provider.id': assetKey.providerId,
          },
        }),
      }

      logErrorWithObservability(
        'Favorite asset summary ensure failed',
        errorResult,
      )

      return Err(errorResult)
    }
    assetSummaryId = ensuredAssetSummaryId
  }

  if (!assetSummaryId) {
    const errorResult = {
      code: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
      message: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
      observability: operationalErrorObservability({
        tags: {
          feature: 'favorites',
          operation: 'asset-summary.missing-id',
          'provider.id': assetKey.providerId,
        },
      }),
    }

    logErrorWithObservability('Favorite asset summary id missing', errorResult)

    return Err(errorResult)
  }
  return Ok(assetSummaryId)
}

const ensurePublicAssetSummary = createServerOnlyFn(
  async (
    assetKey: AssetKey,
  ): Promise<Result<AssetPreviewSnapshotId, ToggleFavoriteErrorCode>> => {
    const serviceClient = createServiceSupabaseClient()
    const eyepieceClient = createEyepieceClient({ origin: getOrigin() })
    return _ensurePublicAssetSummaryForKey(
      serviceClient,
      eyepieceClient,
      assetKey,
    )
  },
)

// Exported for testing only
export const _internals = {
  toggleFavoriteForUser,
  toggleUserFavorite,
  ensurePublicAssetSummaryForKey: _ensurePublicAssetSummaryForKey,
}

export const ensurePublicAssetSummaryAndToggleUserFavorite = createServerOnlyFn(
  async (assetKey: AssetKey): Promise<ToggleFavoriteResult> => {
    const assetSummaryId = unwrapOrThrow(
      await ensurePublicAssetSummary(assetKey),
    )
    return unwrapOrThrow(await toggleUserFavorite(assetSummaryId))
  },
)
