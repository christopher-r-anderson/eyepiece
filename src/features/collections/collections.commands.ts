import { useMemo } from 'react'
import { CollectionsErrorCodes } from './collections.const'
import {
  addCollectionItemAtPositionFn,
  addCollectionItemFn,
  createCollectionFn,
  deleteCollectionFn,
  removeCollectionItemFn,
  renameCollectionFn,
  setCollectionVisibilityFn,
} from './collections.functions'
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
import type { Result, ResultError } from '@/lib/result'
import { Err, Ok, errorFromUnknown } from '@/lib/result'

export function toCollectionsResultError(
  error: unknown,
): ResultError<CollectionsErrorCode | undefined> {
  const resultError = errorFromUnknown(
    error,
    'An unknown (and invalid) error occurred',
  )

  return {
    ...resultError,
    code:
      resultError.code === CollectionsErrorCodes.AUTH_REQUIRED ||
      resultError.code === CollectionsErrorCodes.NOT_FOUND ||
      resultError.code === CollectionsErrorCodes.UNKNOWN_ERROR
        ? resultError.code
        : undefined,
  }
}

type CommandResult<TData> = Promise<
  Result<TData, CollectionsErrorCode | undefined>
>

export interface CollectionsCommands {
  createCollection: (input: CreateCollectionInput) => CommandResult<Collection>
  renameCollection: (input: RenameCollectionInput) => CommandResult<Collection>
  setCollectionVisibility: (
    input: SetCollectionVisibilityInput,
  ) => CommandResult<Collection>
  deleteCollection: (
    input: DeleteCollectionInput,
  ) => CommandResult<{ collectionId: CollectionId }>
  addCollectionItem: (input: CollectionItemInput) => CommandResult<{
    collectionId: CollectionId
    assetPreviewSnapshotId: AssetPreviewSnapshotId
  }>
  addCollectionItemAtPosition: (
    input: CollectionItemAtPositionInput,
  ) => CommandResult<{
    collectionId: CollectionId
    assetPreviewSnapshotId: AssetPreviewSnapshotId
  }>
  removeCollectionItem: (
    input: CollectionItemInput,
  ) => CommandResult<{ removed: boolean }>
}

async function run<TData>(
  operation: () => Promise<TData>,
): CommandResult<TData> {
  try {
    return Ok(await operation())
  } catch (error) {
    return Err(toCollectionsResultError(error))
  }
}

export const makeCollectionsCommands = (): CollectionsCommands => {
  return {
    createCollection: (input) => run(() => createCollectionFn({ data: input })),
    renameCollection: (input) => run(() => renameCollectionFn({ data: input })),
    setCollectionVisibility: (input) =>
      run(() => setCollectionVisibilityFn({ data: input })),
    deleteCollection: (input) => run(() => deleteCollectionFn({ data: input })),
    addCollectionItem: (input) =>
      run(() => addCollectionItemFn({ data: input })),
    addCollectionItemAtPosition: (input) =>
      run(() => addCollectionItemAtPositionFn({ data: input })),
    removeCollectionItem: (input) =>
      run(() => removeCollectionItemFn({ data: input })),
  }
}

export function useCollectionsCommands() {
  return useMemo(() => makeCollectionsCommands(), [])
}
