import { createServerFn } from '@tanstack/react-start'
import {
  addCollectionItem,
  addCollectionItemAtPosition,
  createCollection,
  deleteCollection,
  removeCollectionItem,
  renameCollection,
  setCollectionVisibility,
} from './collections.server'
import {
  collectionItemAtPositionInputSchema,
  collectionItemInputSchema,
  createCollectionInputSchema,
  deleteCollectionInputSchema,
  renameCollectionInputSchema,
  setCollectionVisibilityInputSchema,
} from './collections.schema'

export const createCollectionFn = createServerFn({ method: 'POST' })
  .validator(createCollectionInputSchema)
  .handler(async ({ data }) => createCollection(data))

export const renameCollectionFn = createServerFn({ method: 'POST' })
  .validator(renameCollectionInputSchema)
  .handler(async ({ data }) => renameCollection(data))

export const setCollectionVisibilityFn = createServerFn({ method: 'POST' })
  .validator(setCollectionVisibilityInputSchema)
  .handler(async ({ data }) => setCollectionVisibility(data))

export const deleteCollectionFn = createServerFn({ method: 'POST' })
  .validator(deleteCollectionInputSchema)
  .handler(async ({ data }) => deleteCollection(data))

export const addCollectionItemFn = createServerFn({ method: 'POST' })
  .validator(collectionItemInputSchema)
  .handler(async ({ data }) => addCollectionItem(data))

export const removeCollectionItemFn = createServerFn({ method: 'POST' })
  .validator(collectionItemInputSchema)
  .handler(async ({ data }) => removeCollectionItem(data))

export const addCollectionItemAtPositionFn = createServerFn({ method: 'POST' })
  .validator(collectionItemAtPositionInputSchema)
  .handler(async ({ data }) => addCollectionItemAtPosition(data))
