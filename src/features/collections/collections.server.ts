import { createServerOnlyFn } from '@tanstack/react-start'
import { CollectionsErrorCodes } from './collections.const'
import { COLLECTION_COLUMNS, mapCollection } from './collections.repo'
import type { CollectionsErrorCode } from './collections.const'
import type {
  Collection,
  CollectionId,
  CollectionItemAtPositionInput,
  CollectionItemInput,
  CreateCollectionInput,
  DeleteCollectionInput,
  RenameCollectionInput,
  SetCollectionVisibilityInput,
} from './collections.schema'
import type { AssetPreviewSnapshotId } from '@/domain/asset/asset.schema'
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

function unknownError(operation: string, cause?: unknown) {
  const errorResult = {
    code: CollectionsErrorCodes.UNKNOWN_ERROR,
    message: CollectionsErrorCodes.UNKNOWN_ERROR,
    cause,
    observability: operationalErrorObservability({
      tags: {
        feature: 'collections',
        operation,
      },
    }),
  }
  logErrorWithObservability(`Collections ${operation} failed`, errorResult)
  return errorResult
}

// covers both a missing row and someone else's collection: RLS hides the
// row either way, and the app treats both as not-found
function notFoundError(operation: string) {
  return {
    code: CollectionsErrorCodes.NOT_FOUND,
    message: CollectionsErrorCodes.NOT_FOUND,
    observability: expectedErrorObservability({
      level: 'info',
      tags: {
        feature: 'collections',
        operation,
      },
    }),
  }
}

async function requireUser(
  operation: string,
): Promise<
  Result<{ userId: string; client: SupabaseClient }, CollectionsErrorCode>
> {
  const user = await getUser()
  if (!user) {
    return Err({
      code: CollectionsErrorCodes.AUTH_REQUIRED,
      message: CollectionsErrorCodes.AUTH_REQUIRED,
      observability: expectedErrorObservability({
        level: 'info',
        tags: {
          feature: 'collections',
          operation,
        },
      }),
    })
  }
  return Ok({ userId: user.id, client: createUserSupabaseClient() })
}

// appends go to the end of the owner scope; ties from concurrent appends
// are acceptable (order falls back to created_at until reorder ships)
async function nextPosition(
  client: SupabaseClient,
  table: 'collections' | 'collection_items',
  scopeColumn: 'owner_id' | 'collection_id',
  scopeId: string,
): Promise<Result<number>> {
  const { data, error } = await client
    .from(table)
    .select('position')
    .eq(scopeColumn, scopeId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    return Err({ message: error.message, cause: error })
  }
  return Ok((data?.position ?? 0) + 1)
}

async function createCollectionForUser(
  client: SupabaseClient,
  userId: string,
  input: CreateCollectionInput,
): Promise<Result<Collection, CollectionsErrorCode>> {
  const position = await nextPosition(client, 'collections', 'owner_id', userId)
  if (position.error) {
    return Err(unknownError('create.position', position.error.cause))
  }

  const { data, error } = await client
    .from('collections')
    .insert({
      owner_id: userId,
      name: input.name,
      visibility: input.visibility,
      position: position.data,
    })
    .select(COLLECTION_COLUMNS)
    .single()
  if (error) {
    return Err(unknownError('create.insert', error))
  }
  return Ok(mapCollection(data))
}

async function renameCollectionForUser(
  client: SupabaseClient,
  input: RenameCollectionInput,
): Promise<Result<Collection, CollectionsErrorCode>> {
  const { data, error } = await client
    .from('collections')
    .update({ name: input.name })
    .eq('id', input.collectionId)
    .select(COLLECTION_COLUMNS)
    .maybeSingle()
  if (error) {
    return Err(unknownError('rename.update', error))
  }
  if (data === null) {
    return Err(notFoundError('rename'))
  }
  return Ok(mapCollection(data))
}

async function setCollectionVisibilityForUser(
  client: SupabaseClient,
  input: SetCollectionVisibilityInput,
): Promise<Result<Collection, CollectionsErrorCode>> {
  const { data, error } = await client
    .from('collections')
    .update({ visibility: input.visibility })
    .eq('id', input.collectionId)
    .select(COLLECTION_COLUMNS)
    .maybeSingle()
  if (error) {
    return Err(unknownError('set-visibility.update', error))
  }
  if (data === null) {
    return Err(notFoundError('set-visibility'))
  }
  return Ok(mapCollection(data))
}

async function deleteCollectionForUser(
  client: SupabaseClient,
  input: DeleteCollectionInput,
): Promise<Result<{ collectionId: CollectionId }, CollectionsErrorCode>> {
  const { count, error } = await client
    .from('collections')
    .delete({ count: 'exact' })
    .eq('id', input.collectionId)
  if (error) {
    return Err(unknownError('delete', error))
  }
  if (count !== 1) {
    return Err(notFoundError('delete'))
  }
  return Ok({ collectionId: input.collectionId })
}

// owner-scoped existence check, run before the snapshot is ensured so a
// missing or non-owned collection returns NOT_FOUND instead of a provider
// error, and doesn't create an orphan snapshot for a write RLS will reject.
// the insert-time RLS check stays as the race guard (owner deletes between
// this check and the insert)
async function assertCollectionOwned(
  client: SupabaseClient,
  userId: string,
  collectionId: CollectionId,
): Promise<Result<void, CollectionsErrorCode>> {
  const { data, error } = await client
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('owner_id', userId)
    .maybeSingle()
  if (error) {
    return Err(unknownError('add-item.owner-check', error))
  }
  if (data === null) {
    return Err(notFoundError('add-item'))
  }
  return Ok(undefined)
}

async function addCollectionItemForUser(
  client: SupabaseClient,
  input: CollectionItemInput,
  assetPreviewSnapshotId: AssetPreviewSnapshotId,
  // undo passes the position and created_at the removed item vacated (ties
  // on position order by created_at then id); the default append computes
  // max + 1 and lets the column default stamp created_at
  explicitPosition?: number,
  explicitCreatedAt?: string,
): Promise<
  Result<
    {
      collectionId: CollectionId
      assetPreviewSnapshotId: AssetPreviewSnapshotId
    },
    CollectionsErrorCode
  >
> {
  let position = explicitPosition
  if (position === undefined) {
    const nextResult = await nextPosition(
      client,
      'collection_items',
      'collection_id',
      input.collectionId,
    )
    if (nextResult.error) {
      return Err(unknownError('add-item.position', nextResult.error.cause))
    }
    position = nextResult.data
  }

  const { error } = await client.from('collection_items').insert({
    collection_id: input.collectionId,
    asset_preview_snapshot_id: assetPreviewSnapshotId,
    position,
    ...(explicitCreatedAt ? { created_at: explicitCreatedAt } : {}),
  })
  // 23505: already in the collection - adding is idempotent
  if (error && error.code !== '23505') {
    // RLS (42501) and the collection FK (23503) both mean the collection
    // is not the caller's to write to
    if (error.code === '42501' || error.code === '23503') {
      return Err(notFoundError('add-item'))
    }
    return Err(unknownError('add-item.insert', error))
  }
  return Ok({
    collectionId: input.collectionId,
    assetPreviewSnapshotId,
  })
}

async function removeCollectionItemForUser(
  client: SupabaseClient,
  input: CollectionItemInput,
): Promise<Result<{ removed: boolean }, CollectionsErrorCode>> {
  const { data: snapshot, error: snapshotError } = await client
    .from('asset_preview_snapshots')
    .select('id')
    .eq('provider_id', input.assetKey.providerId)
    .eq('external_id', input.assetKey.externalId)
    .maybeSingle()
  if (snapshotError) {
    return Err(unknownError('remove-item.snapshot-lookup', snapshotError))
  }
  if (snapshot === null) {
    return Ok({ removed: false })
  }

  const { count, error } = await client
    .from('collection_items')
    .delete({ count: 'exact' })
    .eq('collection_id', input.collectionId)
    .eq('asset_preview_snapshot_id', snapshot.id)
  if (error) {
    return Err(unknownError('remove-item.delete', error))
  }
  return Ok({ removed: count === 1 })
}

// Exported for testing only
export const _internals = {
  assertCollectionOwned,
  resolveSnapshotForReAdd,
  createCollectionForUser,
  renameCollectionForUser,
  setCollectionVisibilityForUser,
  deleteCollectionForUser,
  addCollectionItemForUser,
  removeCollectionItemForUser,
}

export const createCollection = createServerOnlyFn(
  async (input: CreateCollectionInput) => {
    const auth = unwrapOrThrow(await requireUser('create'))
    return unwrapOrThrow(
      await createCollectionForUser(auth.client, auth.userId, input),
    )
  },
)

export const renameCollection = createServerOnlyFn(
  async (input: RenameCollectionInput) => {
    const auth = unwrapOrThrow(await requireUser('rename'))
    return unwrapOrThrow(await renameCollectionForUser(auth.client, input))
  },
)

export const setCollectionVisibility = createServerOnlyFn(
  async (input: SetCollectionVisibilityInput) => {
    const auth = unwrapOrThrow(await requireUser('set-visibility'))
    return unwrapOrThrow(
      await setCollectionVisibilityForUser(auth.client, input),
    )
  },
)

export const deleteCollection = createServerOnlyFn(
  async (input: DeleteCollectionInput) => {
    const auth = unwrapOrThrow(await requireUser('delete'))
    return unwrapOrThrow(await deleteCollectionForUser(auth.client, input))
  },
)

export const addCollectionItem = createServerOnlyFn(
  async (input: CollectionItemInput) => {
    const auth = unwrapOrThrow(await requireUser('add-item'))
    unwrapOrThrow(
      await assertCollectionOwned(auth.client, auth.userId, input.collectionId),
    )
    const snapshot = await ensureAssetPreviewSnapshot(input.assetKey)
    if (snapshot.error) {
      throwFromErrorResult(
        unknownError('add-item.ensure-snapshot', snapshot.error.cause),
      )
    }
    return unwrapOrThrow(
      await addCollectionItemForUser(auth.client, input, snapshot.data),
    )
  },
)

// undo must not depend on a live provider: the just-removed item's snapshot
// still exists locally (30-day orphan grace), so reuse it and only fall back
// to the provider-backed ensure when the row is genuinely gone
async function resolveSnapshotForReAdd(
  client: SupabaseClient,
  assetKey: CollectionItemInput['assetKey'],
): Promise<Result<AssetPreviewSnapshotId, CollectionsErrorCode>> {
  const { data, error } = await client
    .from('asset_preview_snapshots')
    .select('id')
    .eq('provider_id', assetKey.providerId)
    .eq('external_id', assetKey.externalId)
    .maybeSingle()
  if (error) {
    return Err(unknownError('re-add-item.snapshot-lookup', error))
  }
  if (data) {
    return Ok(data.id)
  }
  const ensured = await ensureAssetPreviewSnapshot(assetKey)
  if (ensured.error) {
    return Err(unknownError('re-add-item.ensure-snapshot', ensured.error.cause))
  }
  return Ok(ensured.data)
}

export const addCollectionItemAtPosition = createServerOnlyFn(
  async (input: CollectionItemAtPositionInput) => {
    const auth = unwrapOrThrow(await requireUser('re-add-item'))
    unwrapOrThrow(
      await assertCollectionOwned(auth.client, auth.userId, input.collectionId),
    )
    const snapshotId = unwrapOrThrow(
      await resolveSnapshotForReAdd(auth.client, input.assetKey),
    )
    const createdAt = clampIsoToNow(input.createdAt)
    return unwrapOrThrow(
      await addCollectionItemForUser(
        auth.client,
        input,
        snapshotId,
        input.position,
        createdAt,
      ),
    )
  },
)

export const removeCollectionItem = createServerOnlyFn(
  async (input: CollectionItemInput) => {
    const auth = unwrapOrThrow(await requireUser('remove-item'))
    const result = unwrapOrThrow(
      await removeCollectionItemForUser(auth.client, input),
    )
    if (result.removed) {
      // the sweep grace must start at orphaning, not at the last content
      // refresh: touch the snapshot (moddatetime bumps updated_at) so a
      // long-stale snapshot isn't instantly sweep-eligible and undo stays
      // local. Best-effort in full: nothing here - including service-client
      // construction - may fail an already-committed removal
      try {
        const { error } = await createServiceSupabaseClient()
          .from('asset_preview_snapshots')
          .update({ updated_at: new Date().toISOString() })
          .eq('provider_id', input.assetKey.providerId)
          .eq('external_id', input.assetKey.externalId)
        if (error) {
          throw error
        }
      } catch (error) {
        logErrorWithObservability(
          'Collections remove-item snapshot touch failed',
          error,
        )
      }
    }
    return result
  },
)
