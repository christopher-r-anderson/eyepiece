import { describe, expect, it } from 'vitest'
import { stringifySearchParams } from './search-params'

describe('stringifySearchParams', () => {
  it('serializes equal searches identically regardless of key order', () => {
    expect(stringifySearchParams({ q: 'moon', providerId: 'nasa_ivl' })).toBe(
      stringifySearchParams({ providerId: 'nasa_ivl', q: 'moon' }),
    )
  })

  it('sorts keys', () => {
    expect(
      stringifySearchParams({ q: 'moon', mediaType: 'image', yearStart: 1990 }),
    ).toBe('?mediaType=image&q=moon&yearStart=1990')
  })

  it('serializes an empty search to an empty string', () => {
    expect(stringifySearchParams({})).toBe('')
  })
})
