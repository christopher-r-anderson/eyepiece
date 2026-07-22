import { createServerOnlyFn } from '@tanstack/react-start'
import { CollectionsErrorCodes } from './collections.const'
import { COLLECTION_COLUMNS, mapCollection } from './collections.repo'
import type { CollectionsErrorCode } from './collections.const'
import type {
  Collection,
  CollectionId,
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
import { getUser } from '@/features/auth/get-user'
import {
  expectedErrorObservability,
  operationalErrorObservability,
} from '@/lib/error-observability'
import { logErrorWithObservability } from '@/lib/error-logging'
import { Err, Ok, throwFromErrorResult, unwrapOrThrow } from '@/lib/result'
import { ensureAssetPreviewSnapshot } from '@/features/assets/asset-preview-snapshots.server'

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

async function addCollectionItemForUser(
  client: SupabaseClient,
  input: CollectionItemInput,
  assetPreviewSnapshotId: AssetPreviewSnapshotId,
): Promise<
  Result<
    {
      collectionId: CollectionId
      assetPreviewSnapshotId: AssetPreviewSnapshotId
    },
    CollectionsErrorCode
  >
> {
  const position = await nextPosition(
    client,
    'collection_items',
    'collection_id',
    input.collectionId,
  )
  if (position.error) {
    return Err(unknownError('add-item.position', position.error.cause))
  }

  const { error } = await client.from('collection_items').insert({
    collection_id: input.collectionId,
    asset_preview_snapshot_id: assetPreviewSnapshotId,
    position: position.data,
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

export const removeCollectionItem = createServerOnlyFn(
  async (input: CollectionItemInput) => {
    const auth = unwrapOrThrow(await requireUser('remove-item'))
    return unwrapOrThrow(await removeCollectionItemForUser(auth.client, input))
  },
)
