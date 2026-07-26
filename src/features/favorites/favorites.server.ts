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
import { clampIsoToNow } from '@/lib/utils'

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

// build-and-log for the operational failure shape the new write paths share
function operationalFavoritesError(
  operation: string,
  logMessage: string,
  cause: unknown,
) {
  const errorResult = {
    code: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
    message: ToggleFavoriteErrorCodes.UNKNOWN_ERROR,
    cause,
    observability: operationalErrorObservability({
      tags: { feature: 'favorites', operation },
    }),
  }
  logErrorWithObservability(logMessage, errorResult)
  return errorResult
}

async function lookupStoredSnapshotId(
  client: SupabaseClient,
  assetKey: AssetKey,
  operation: string,
): Promise<Result<AssetPreviewSnapshotId | null, ToggleFavoriteErrorCode>> {
  const { data, error } = await client
    .from('asset_preview_snapshots')
    .select('id')
    .eq('provider_id', assetKey.providerId)
    .eq('external_id', assetKey.externalId)
    .maybeSingle()
  if (error) {
    return Err(
      operationalFavoritesError(operation, 'Snapshot lookup failed', error),
    )
  }
  return Ok(data?.id ?? null)
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
    const snapshotId = unwrapOrThrow(
      await lookupStoredSnapshotId(client, assetKey, 'unfavorite.lookup'),
    )
    if (!snapshotId) {
      return { removed: false }
    }
    const { count, error } = await client
      .from('favorites')
      .delete({ count: 'exact' })
      .eq('owner_id', user.id)
      .eq('asset_preview_snapshot_id', snapshotId)
    if (error) {
      throwFromErrorResult(
        operationalFavoritesError(
          'unfavorite.delete',
          'Unfavorite delete failed',
          error,
        ),
      )
    }
    if (count === 1) {
      try {
        const { error: touchError } = await createServiceSupabaseClient()
          .from('asset_preview_snapshots')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', snapshotId)
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
  const lookedUp = await lookupStoredSnapshotId(
    client,
    assetKey,
    're-favorite.lookup',
  )
  if (lookedUp.error) {
    return lookedUp
  }
  if (lookedUp.data) {
    return Ok(lookedUp.data)
  }
  const ensured = await ensureAssetPreviewSnapshot(assetKey)
  if (ensured.error) {
    return Err(
      operationalFavoritesError(
        're-favorite.ensure',
        'Re-favorite snapshot ensure failed',
        ensured.error.cause,
      ),
    )
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
    const createdAt = clampIsoToNow(input.createdAt)
    const { error } = await client.from('favorites').insert({
      owner_id: user.id,
      asset_preview_snapshot_id: assetPreviewSnapshotId,
      created_at: createdAt,
    })
    // 23505: already favorited again - restoring is idempotent
    if (error && error.code !== '23505') {
      throwFromErrorResult(
        operationalFavoritesError(
          're-favorite.insert',
          'Re-favorite insert failed',
          error,
        ),
      )
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
