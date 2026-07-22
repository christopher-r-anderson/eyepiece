import { createServerOnlyFn } from '@tanstack/react-start'
import {
  ASSET_PREVIEW_SNAPSHOT_STALE_TIME,
  EnsureAssetPreviewSnapshotErrorCodes,
} from './asset-preview-snapshots.const'
import type { EnsureAssetPreviewSnapshotErrorCode } from './asset-preview-snapshots.const'
import type {
  AssetKey,
  AssetPreviewSnapshotId,
} from '@/domain/asset/asset.schema'
import type { Result } from '@/lib/result'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import { createServiceSupabaseClient } from '@/integrations/supabase/service'
import { createEyepieceClient } from '@/lib/eyepiece-api-client/client'
import { operationalErrorObservability } from '@/lib/error-observability'
import { logErrorWithObservability } from '@/lib/error-logging'
import { Err, Ok } from '@/lib/result'
import { getOrigin } from '@/lib/utils'

// Internal implementation extracted for unit testing only because it uses a
// service client. **do NOT call directly**, instead use
// `ensureAssetPreviewSnapshot` which is guarded
async function _ensureAssetPreviewSnapshotForKey(
  serviceClient: SupabaseClient,
  eyepieceClient: EyepieceClient,
  assetKey: AssetKey,
): Promise<
  Result<AssetPreviewSnapshotId, EnsureAssetPreviewSnapshotErrorCode>
> {
  let assetPreviewSnapshotId

  const { data: currentSnapshot, error: currentSnapshotError } =
    await serviceClient
      .from('asset_preview_snapshots')
      .select('id, updated_at')
      .eq('provider_id', assetKey.providerId)
      .eq('external_id', assetKey.externalId)
      .maybeSingle()

  if (currentSnapshotError) {
    const errorResult = {
      code: EnsureAssetPreviewSnapshotErrorCodes.UNKNOWN_ERROR,
      message: EnsureAssetPreviewSnapshotErrorCodes.UNKNOWN_ERROR,
      cause: currentSnapshotError,
      observability: operationalErrorObservability({
        tags: {
          feature: 'assets',
          operation: 'snapshot.lookup',
          'provider.id': assetKey.providerId,
        },
      }),
    }

    logErrorWithObservability(
      'Asset preview snapshot lookup failed',
      errorResult,
    )

    return Err(errorResult)
  }
  if (currentSnapshot) {
    const snapshotUpdatedAt = new Date(currentSnapshot.updated_at)
    if (
      Date.now() - snapshotUpdatedAt.getTime() <
      ASSET_PREVIEW_SNAPSHOT_STALE_TIME
    ) {
      assetPreviewSnapshotId = currentSnapshot.id
    }
  }

  if (!assetPreviewSnapshotId) {
    let asset
    try {
      asset = await eyepieceClient.getAsset(assetKey)
    } catch (error) {
      const errorResult = {
        code: EnsureAssetPreviewSnapshotErrorCodes.UNKNOWN_ERROR,
        message: EnsureAssetPreviewSnapshotErrorCodes.UNKNOWN_ERROR,
        cause: error,
        observability: operationalErrorObservability({
          tags: {
            feature: 'assets',
            operation: 'snapshot.fetch-asset',
            'provider.id': assetKey.providerId,
          },
        }),
      }

      logErrorWithObservability(
        'Asset preview snapshot asset fetch failed',
        errorResult,
      )

      return Err(errorResult)
    }
    const { data: ensuredSnapshotId, error: ensureSnapshotError } =
      await serviceClient.rpc('ensure_asset_preview_snapshot', {
        p_provider_id: assetKey.providerId,
        p_external_id: assetKey.externalId,
        p_title: asset.title,
        p_thumb_href: asset.thumbnail.href,
        p_thumb_width: asset.thumbnail.width,
        p_thumb_height: asset.thumbnail.height,
      })
    if (ensureSnapshotError) {
      const errorResult = {
        code: EnsureAssetPreviewSnapshotErrorCodes.UNKNOWN_ERROR,
        message: EnsureAssetPreviewSnapshotErrorCodes.UNKNOWN_ERROR,
        cause: ensureSnapshotError,
        observability: operationalErrorObservability({
          tags: {
            feature: 'assets',
            operation: 'snapshot.ensure',
            'provider.id': assetKey.providerId,
          },
        }),
      }

      logErrorWithObservability(
        'Asset preview snapshot ensure failed',
        errorResult,
      )

      return Err(errorResult)
    }
    assetPreviewSnapshotId = ensuredSnapshotId
  }

  if (!assetPreviewSnapshotId) {
    const errorResult = {
      code: EnsureAssetPreviewSnapshotErrorCodes.UNKNOWN_ERROR,
      message: EnsureAssetPreviewSnapshotErrorCodes.UNKNOWN_ERROR,
      observability: operationalErrorObservability({
        tags: {
          feature: 'assets',
          operation: 'snapshot.missing-id',
          'provider.id': assetKey.providerId,
        },
      }),
    }

    logErrorWithObservability(
      'Asset preview snapshot id missing',
      errorResult,
    )

    return Err(errorResult)
  }
  return Ok(assetPreviewSnapshotId)
}

// Resolves an asset key to a snapshot id, refreshing title/thumbnail from the
// provider when the stored row is older than the stale window. The shared
// write path for every snapshot consumer (favorites, collections).
export const ensureAssetPreviewSnapshot = createServerOnlyFn(
  async (
    assetKey: AssetKey,
  ): Promise<
    Result<AssetPreviewSnapshotId, EnsureAssetPreviewSnapshotErrorCode>
  > => {
    const serviceClient = createServiceSupabaseClient()
    const eyepieceClient = createEyepieceClient({ origin: getOrigin() })
    return _ensureAssetPreviewSnapshotForKey(
      serviceClient,
      eyepieceClient,
      assetKey,
    )
  },
)

// Exported for testing only
export const _internals = {
  ensureAssetPreviewSnapshotForKey: _ensureAssetPreviewSnapshotForKey,
}
