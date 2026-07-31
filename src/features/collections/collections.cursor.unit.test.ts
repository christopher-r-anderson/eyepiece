import { describe, expect, it } from 'vitest'
import {
  decodeCollectionItemEdgesCursor,
  encodeCollectionItemEdgesCursor,
} from './collections.cursor'
import { resultIsError, resultIsSuccess } from '@/lib/result'

const CREATED_AT = '2026-07-31T02:10:05.123456+00:00'
const SNAPSHOT_ID = '550e8400-e29b-41d4-a716-446655440001'

describe('collection item edges cursor', () => {
  it('round-trips through encode and decode', () => {
    const cursor = encodeCollectionItemEdgesCursor({
      position: 7,
      createdAt: CREATED_AT,
      assetPreviewSnapshotId: SNAPSHOT_ID,
    })

    expect(cursor).toBe(`7/${CREATED_AT}/${SNAPSHOT_ID}`)
    const decoded = decodeCollectionItemEdgesCursor(cursor)
    expect(resultIsSuccess(decoded)).toBe(true)
    if (resultIsSuccess(decoded)) {
      expect(decoded.data).toEqual({
        position: 7,
        createdAt: CREATED_AT,
        snapshotId: SNAPSHOT_ID,
      })
    }
  })

  it.each([
    ['too few parts', `${CREATED_AT}/${SNAPSHOT_ID}`],
    ['too many parts', `7/${CREATED_AT}/${SNAPSHOT_ID}/extra`],
    ['non-numeric position', `seven/${CREATED_AT}/${SNAPSHOT_ID}`],
    ['empty position', `/${CREATED_AT}/${SNAPSHOT_ID}`],
    ['exponent position', `1e2/${CREATED_AT}/${SNAPSHOT_ID}`],
    ['unsafe position', `${'9'.repeat(400)}/${CREATED_AT}/${SNAPSHOT_ID}`],
    ['bad timestamp', `7/yesterday/${SNAPSHOT_ID}`],
    ['bad snapshot id', `7/${CREATED_AT}/not-a-uuid`],
    ['empty', ''],
  ])('rejects %s', (_label, cursor) => {
    expect(resultIsError(decodeCollectionItemEdgesCursor(cursor))).toBe(true)
  })
})
