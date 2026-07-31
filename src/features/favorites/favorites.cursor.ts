import { z } from 'zod'
import type { FavoriteEdge } from './favorites.schema'
import type { Result } from '@/lib/result'
import { Err, Ok } from '@/lib/result'

// created_at is ISO 8601 and contains no '/', so the first one delimits
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
