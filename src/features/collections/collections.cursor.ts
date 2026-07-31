import { z } from 'zod'
import type { CollectionItemEdge } from './collections.schema'
import type { Result } from '@/lib/result'
import { Err, Ok } from '@/lib/result'

// no part contains '/', so the cursor splits cleanly into three.
// digits-only before converting: z.coerce would accept '' (as 0) and '1e2'
const collectionItemEdgesCursorSchema = z.object({
  position: z
    .string()
    .regex(/^\d+$/)
    .transform((value) => Number(value))
    .pipe(z.int()),
  createdAt: z.iso.datetime({ offset: true }),
  snapshotId: z.uuid(),
})

export type CollectionItemEdgesCursor = z.infer<
  typeof collectionItemEdgesCursorSchema
>

export function encodeCollectionItemEdgesCursor(
  edge: Pick<
    CollectionItemEdge,
    'position' | 'createdAt' | 'assetPreviewSnapshotId'
  >,
): string {
  return `${edge.position}/${edge.createdAt}/${edge.assetPreviewSnapshotId}`
}

export function decodeCollectionItemEdgesCursor(
  cursor: string,
): Result<CollectionItemEdgesCursor> {
  const [position, createdAt, snapshotId, ...rest] = cursor.split('/')
  const { data, error } = collectionItemEdgesCursorSchema.safeParse(
    rest.length === 0 ? { position, createdAt, snapshotId } : {},
  )
  if (error) {
    return Err({ message: 'Invalid collection items cursor', cause: error })
  }
  return Ok(data)
}
