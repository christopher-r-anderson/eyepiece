import { describe, expect, it } from 'vitest'
import {
  decodeFavoritesEdgesCursor,
  encodeFavoritesEdgesCursor,
} from './favorites.cursor'
import { resultIsError, resultIsSuccess } from '@/lib/result'

const CREATED_AT = '2026-07-30T18:22:41.123456+00:00'
const SNAPSHOT_ID = '550e8400-e29b-41d4-a716-446655440001'

describe('favorites edges cursor', () => {
  it('round-trips through encode and decode', () => {
    const cursor = encodeFavoritesEdgesCursor({
      createdAt: CREATED_AT,
      assetPreviewSnapshotId: SNAPSHOT_ID,
    })

    expect(cursor).toBe(`${CREATED_AT}/${SNAPSHOT_ID}`)
    const decoded = decodeFavoritesEdgesCursor(cursor)
    expect(resultIsSuccess(decoded)).toBe(true)
    if (resultIsSuccess(decoded)) {
      expect(decoded.data).toEqual({
        createdAt: CREATED_AT,
        snapshotId: SNAPSHOT_ID,
      })
    }
  })

  it.each([
    ['no delimiter', 'not-a-cursor'],
    ['bad timestamp', `yesterday/${SNAPSHOT_ID}`],
    ['bad snapshot id', `${CREATED_AT}/not-a-uuid`],
    ['empty', ''],
  ])('rejects %s', (_label, cursor) => {
    expect(resultIsError(decodeFavoritesEdgesCursor(cursor))).toBe(true)
  })
})
