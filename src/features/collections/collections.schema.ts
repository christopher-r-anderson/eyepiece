import { z } from 'zod'
import {
  assetKeySchema,
  assetPreviewSnapshotSchema,
} from '@/domain/asset/asset.schema'

export const collectionVisibilitySchema = z.enum(['public', 'private'])

export type CollectionVisibility = z.infer<typeof collectionVisibilitySchema>

export const collectionIdSchema = z.uuid()

export type CollectionId = z.infer<typeof collectionIdSchema>

// bounds mirror the DB checks (nonempty, <= 120)
export const collectionNameSchema = z.string().trim().min(1).max(120)

const collectionSchema = z.object({
  id: collectionIdSchema,
  ownerId: z.uuid(),
  name: collectionNameSchema,
  visibility: collectionVisibilitySchema,
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
})

export type Collection = z.infer<typeof collectionSchema>

const collectionCardSchema = z.object({
  collection: collectionSchema,
  itemCount: z.number().int().nonnegative(),
  cover: assetPreviewSnapshotSchema.nullable(),
})

export type CollectionCard = z.infer<typeof collectionCardSchema>

const collectionItemEdgeSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  assetPreviewSnapshotId: z.uuid(),
  assetKey: assetKeySchema,
  position: z.number().int(),
})

export type CollectionItemEdge = z.infer<typeof collectionItemEdgeSchema>

export const createCollectionInputSchema = z.object({
  name: collectionNameSchema,
  visibility: collectionVisibilitySchema.default('private'),
})

export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>

export const renameCollectionInputSchema = z.object({
  collectionId: collectionIdSchema,
  name: collectionNameSchema,
})

export type RenameCollectionInput = z.infer<typeof renameCollectionInputSchema>

export const setCollectionVisibilityInputSchema = z.object({
  collectionId: collectionIdSchema,
  visibility: collectionVisibilitySchema,
})

export type SetCollectionVisibilityInput = z.infer<
  typeof setCollectionVisibilityInputSchema
>

export const deleteCollectionInputSchema = z.object({
  collectionId: collectionIdSchema,
})

export type DeleteCollectionInput = z.infer<typeof deleteCollectionInputSchema>

export const collectionItemInputSchema = z.object({
  collectionId: collectionIdSchema,
  assetKey: assetKeySchema,
})

export type CollectionItemInput = z.infer<typeof collectionItemInputSchema>

// undo's re-add: restores a removed item to the position it vacated,
// instead of the default append
export const collectionItemAtPositionInputSchema =
  collectionItemInputSchema.extend({
    position: z.number().int().positive(),
    // ties on position order by created_at then id, so a true restore
    // carries the original timestamp as well
    createdAt: z.iso.datetime({ offset: true }),
  })

export type CollectionItemAtPositionInput = z.infer<
  typeof collectionItemAtPositionInputSchema
>
