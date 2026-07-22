import { describe, expect, it } from 'vitest'
import { parseSearchParams, stringifySearchParams } from './search-params'

describe('parseSearchParams', () => {
  it('decodes form-encoded plus signs as spaces', () => {
    expect(parseSearchParams('?q=crab+nebula')).toEqual({ q: 'crab nebula' })
  })

  it('keeps percent-encoded plus signs literal', () => {
    expect(parseSearchParams('?q=c%2B%2B')).toEqual({ q: 'c++' })
  })

  it('round-trips a query containing a plus sign', () => {
    const search = { q: 'c++ nebula' }
    expect(parseSearchParams(stringifySearchParams(search))).toEqual(search)
  })
})

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

  it('omits empty-string values', () => {
    expect(stringifySearchParams({ q: 'moon', yearStart: '' })).toBe('?q=moon')
    expect(stringifySearchParams({ q: '' })).toBe('')
  })

  it('spells spaces as plus signs, matching native form encoding', () => {
    expect(stringifySearchParams({ q: 'crab nebula' })).toBe('?q=crab+nebula')
  })
})
