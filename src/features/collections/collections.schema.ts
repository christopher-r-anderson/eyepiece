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

export const collectionSchema = z.object({
  id: collectionIdSchema,
  ownerId: z.uuid(),
  name: collectionNameSchema,
  visibility: collectionVisibilitySchema,
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
})

export type Collection = z.infer<typeof collectionSchema>

export const collectionCardSchema = z.object({
  collection: collectionSchema,
  itemCount: z.number().int().nonnegative(),
  cover: assetPreviewSnapshotSchema.nullable(),
})

export type CollectionCard = z.infer<typeof collectionCardSchema>

export const collectionItemEdgeSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  assetPreviewSnapshotId: z.uuid(),
  assetKey: assetKeySchema,
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
