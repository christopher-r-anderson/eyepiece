import { describe, expect, it } from 'vitest'
import { eagerTileCount } from './justified-grid.layout'

describe('eagerTileCount', () => {
  it('returns zero for an empty grid', () => {
    expect(eagerTileCount([])).toBe(0)
  })

  it('covers more portrait tiles than landscape ones', () => {
    const portraits = Array.from({ length: 60 }, () => 0.5)
    const landscapes = Array.from({ length: 60 }, () => 1.8)
    expect(eagerTileCount(portraits)).toBeGreaterThan(
      eagerTileCount(landscapes),
    )
  })

  it('never exceeds the tile count', () => {
    expect(eagerTileCount([1.5, 1.5])).toBe(2)
  })
})
