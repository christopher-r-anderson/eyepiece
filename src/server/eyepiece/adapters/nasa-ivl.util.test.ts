import { describe, expect, it } from 'vitest'
import { calculateNasaAlbumRequests } from './nasa-ivl.util'

describe('calculateNasaAlbumRequests', () => {
  it('handles simple case at beginning of first page', () => {
    // Page 1, size 20 -> items 0-19
    const result = calculateNasaAlbumRequests(1, 20)
    expect(result).toEqual([{ page: 1, sliceStart: 0, sliceEnd: 20 }])
  })

  it('handles simple case in middle of first page', () => {
    // Page 2, size 20 -> items 20-39
    const result = calculateNasaAlbumRequests(2, 20)
    expect(result).toEqual([{ page: 1, sliceStart: 20, sliceEnd: 40 }])
  })

  it('handles matching size at first page', () => {
    // Page 1, size 100 -> items 0-99
    const result = calculateNasaAlbumRequests(1, 100)
    expect(result).toEqual([{ page: 1, sliceStart: 0, sliceEnd: 100 }])
  })

  it('handles boundary crossing', () => {
    // Custom page size to force crossing
    // Page 2, size 90.
    // Start = 90. End = 180.
    // NASA Page 1 (0-99), NASA Page 2 (100-199).
    // Page 1: 90-100 (10 items)
    // Page 2: 0-80 (80 items) -> Total 90.

    const result = calculateNasaAlbumRequests(2, 90)
    expect(result).toEqual([
      { page: 1, sliceStart: 90, sliceEnd: 100 },
      { page: 2, sliceStart: 0, sliceEnd: 80 },
    ])
  })

  it('handles exact boundary end', () => {
    // Start 80, size 20 -> 80-100 (indices 80-99).
    // Should only be Page 1.
    // Eyepiece page 5, size 20.
    const result = calculateNasaAlbumRequests(5, 20)
    expect(result).toEqual([{ page: 1, sliceStart: 80, sliceEnd: 100 }])
  })

  it('handles exact boundary start', () => {
    // Start 100, size 20 -> 100-120.
    // Should only be Page 2.
    // Eyepiece page 6, size 20.
    const result = calculateNasaAlbumRequests(6, 20)
    expect(result).toEqual([{ page: 2, sliceStart: 0, sliceEnd: 20 }])
  })
})
