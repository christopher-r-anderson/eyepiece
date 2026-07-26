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
import { createServiceSupabaseClient } from '@/integrations/supabase/service'
import { getUser } from '@/features/auth/get-user'
import {
  expectedErrorObservability,
  operationalErrorObservability,
} from '@/lib/error-observability'
import { logErrorWithObservability } from '@/lib/error-logging'
import { Err, Ok, throwFromErrorResult, unwrapOrThrow } from '@/lib/result'
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
  resolveSnapshotForRefavorite,
}

// an explicit remove, not a toggle: the ghost idiom queues operations, and
// a toggle replayed after a failed neighbor flips parity (server refavorites
// an item the UI shows removed). Deleting is idempotent, needs no provider,
// and touches the snapshot so the orphan-sweep grace starts at unstarring.
export const unfavoriteUserFavorite = createServerOnlyFn(
  async (assetKey: AssetKey): Promise<{ removed: boolean }> => {
    const user = await getUser()
    if (!user) {
      throwFromErrorResult({
        code: ToggleFavoriteErrorCodes.AUTH_REQUIRED,
        message: ToggleFavoriteErrorCodes.AUTH_REQUIRED,
        observability: expectedErrorObservability({
          level: 'info',
          tags: { feature: 'favorites', operation: 'unfavorite.auth' },
        }),
      })
    }
    const client = createUserSupabaseClient()
    const { data: snapshot, error: lookupError } = await client
      .from('asset_preview_snapshots')
      .select('id')
      .eq('provider_id', assetKey.providerId)
      .eq('external_id', assetKey.externalId)
      .maybeSingle()
    if (lookupError) {
      const errorResult = {
        code: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
        message: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
        cause: lookupError,
        observability: operationalErrorObservability({
          tags: { feature: 'favorites', operation: 'unfavorite.lookup' },
        }),
      }
      logErrorWithObservability('Unfavorite lookup failed', errorResult)
      throwFromErrorResult(errorResult)
    }
    if (!snapshot) {
      return { removed: false }
    }
    const { count, error } = await client
      .from('favorites')
      .delete({ count: 'exact' })
      .eq('owner_id', user.id)
      .eq('asset_preview_snapshot_id', snapshot.id)
    if (error) {
      const errorResult = {
        code: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
        message: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
        cause: error,
        observability: operationalErrorObservability({
          tags: { feature: 'favorites', operation: 'unfavorite.delete' },
        }),
      }
      logErrorWithObservability('Unfavorite delete failed', errorResult)
      throwFromErrorResult(errorResult)
    }
    if (count === 1) {
      try {
        const { error: touchError } = await createServiceSupabaseClient()
          .from('asset_preview_snapshots')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', snapshot.id)
        if (touchError) {
          throw touchError
        }
      } catch (touchError) {
        logErrorWithObservability(
          'Unfavorite snapshot touch failed',
          touchError,
        )
      }
    }
    return { removed: count === 1 }
  },
)

// undo must not depend on a live provider: reuse the stored snapshot and
// only fall back to the provider-backed ensure when the row is gone
async function resolveSnapshotForRefavorite(
  client: SupabaseClient,
  assetKey: AssetKey,
): Promise<Result<AssetPreviewSnapshotId, ToggleFavoriteErrorCode>> {
  const { data, error } = await client
    .from('asset_preview_snapshots')
    .select('id')
    .eq('provider_id', assetKey.providerId)
    .eq('external_id', assetKey.externalId)
    .maybeSingle()
  if (error) {
    const errorResult = {
      code: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
      message: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
      cause: error,
      observability: operationalErrorObservability({
        tags: { feature: 'favorites', operation: 're-favorite.lookup' },
      }),
    }
    logErrorWithObservability('Re-favorite snapshot lookup failed', errorResult)
    return Err(errorResult)
  }
  if (data) {
    return Ok(data.id)
  }
  const ensured = await ensureAssetPreviewSnapshot(assetKey)
  if (ensured.error) {
    const errorResult = {
      code: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
      message: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
      cause: ensured.error.cause,
      observability: operationalErrorObservability({
        tags: { feature: 'favorites', operation: 're-favorite.ensure' },
      }),
    }
    logErrorWithObservability('Re-favorite snapshot ensure failed', errorResult)
    return Err(errorResult)
  }
  return Ok(ensured.data)
}

export const refavoriteUserFavoriteAt = createServerOnlyFn(
  async (input: {
    assetKey: AssetKey
    createdAt: string
  }): Promise<ToggleFavoriteResult> => {
    const user = await getUser()
    if (!user) {
      throwFromErrorResult({
        code: ToggleFavoriteErrorCodes.AUTH_REQUIRED,
        message: ToggleFavoriteErrorCodes.AUTH_REQUIRED,
        observability: expectedErrorObservability({
          level: 'info',
          tags: { feature: 'favorites', operation: 're-favorite.auth' },
        }),
      })
    }
    const client = createUserSupabaseClient()
    const assetPreviewSnapshotId = unwrapOrThrow(
      await resolveSnapshotForRefavorite(client, input.assetKey),
    )
    // clamp to now: the timestamp restores ordering after an undo, not a
    // client-chosen position in the future
    const createdAt =
      new Date(input.createdAt) > new Date()
        ? new Date().toISOString()
        : input.createdAt
    const { error } = await client.from('favorites').insert({
      owner_id: user.id,
      asset_preview_snapshot_id: assetPreviewSnapshotId,
      created_at: createdAt,
    })
    // 23505: already favorited again - restoring is idempotent
    if (error && error.code !== '23505') {
      const errorResult = {
        code: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
        message: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
        cause: error,
        observability: operationalErrorObservability({
          tags: { feature: 'favorites', operation: 're-favorite.insert' },
        }),
      }
      logErrorWithObservability('Re-favorite insert failed', errorResult)
      throwFromErrorResult(errorResult)
    }
    return { assetPreviewSnapshotId, isFavorited: true }
  },
)

export const ensureSnapshotAndToggleUserFavorite = createServerOnlyFn(
  async (assetKey: AssetKey): Promise<ToggleFavoriteResult> => {
    const assetPreviewSnapshotId = unwrapOrThrow(
      await ensureAssetPreviewSnapshot(assetKey),
    )
    return unwrapOrThrow(await toggleUserFavorite(assetPreviewSnapshotId))
  },
)
