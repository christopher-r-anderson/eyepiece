import { z } from 'zod'
import type { FavoriteEdge } from './favorites.schema'
import type { Result } from '@/lib/result'
import { Err, Ok } from '@/lib/result'

// The keyset cursor for the favorites edges walk: the ordering keys of the
// last row served, readable on purpose (see #209). created_at is ISO 8601
// and contains no '/', so the first one is the delimiter.
const favoritesEdgesCursorSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  snapshotId: z.uuid(),
})

export type FavoritesEdgesCursor = z.infer<typeof favoritesEdgesCursorSchema>

export function encodeFavoritesEdgesCursor(
  edge: Pick<FavoriteEdge, 'createdAt' | 'assetPreviewSnapshotId'>,
): string {
  return `${edge.createdAt}/${edge.assetPreviewSnapshotId}`
}

export function decodeFavoritesEdgesCursor(
  cursor: string,
): Result<FavoritesEdgesCursor> {
  const delimiter = cursor.indexOf('/')
  const { data, error } = favoritesEdgesCursorSchema.safeParse({
    createdAt: cursor.slice(0, delimiter),
    snapshotId: cursor.slice(delimiter + 1),
  })
  if (error) {
    return Err({ message: 'Invalid favorites cursor', cause: error })
  }
  return Ok(data)
}
