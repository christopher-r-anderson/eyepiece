import { describe, expect, it } from 'vitest'
import {
  parseSearchParams,
  stringifyApiSearchParams,
  stringifyCanonicalSearchParams,
  stringifySearchParams,
} from './search-params'

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

  it('preserves empty-string values for API request params', () => {
    expect(stringifySearchParams({ q: '', page: 1 })).toBe('?page=1&q=')
  })

  it('spells spaces as plus signs, matching native form encoding', () => {
    expect(stringifySearchParams({ q: 'crab nebula' })).toBe('?q=crab+nebula')
  })
})

describe('stringifyCanonicalSearchParams', () => {
  it('omits empty-string values', () => {
    expect(stringifyCanonicalSearchParams({ q: 'moon', yearStart: '' })).toBe(
      '?q=moon',
    )
    expect(stringifyCanonicalSearchParams({ q: '' })).toBe('')
  })

  it('sorts keys like the base serializer', () => {
    expect(stringifyCanonicalSearchParams({ q: 'moon', filter: 'stars' })).toBe(
      '?filter=stars&q=moon',
    )
  })
})

describe('stringifyApiSearchParams', () => {
  it('serializes numeric-looking strings without JSON quoting', () => {
    expect(stringifyApiSearchParams({ cursor: '2', pageSize: 24 })).toBe(
      '?cursor=2&pageSize=24',
    )
  })

  it('sorts keys, drops undefined, keeps empty strings', () => {
    expect(
      stringifyApiSearchParams({
        q: '',
        providerId: 'nasa_ivl',
        yearStart: undefined,
      }),
    ).toBe('?providerId=nasa_ivl&q=')
  })

  it('form-encodes spaces the way URLSearchParams reads them back', () => {
    expect(stringifyApiSearchParams({ q: 'crab nebula' })).toBe(
      '?q=crab+nebula',
    )
  })

  it('returns an empty string for no params', () => {
    expect(stringifyApiSearchParams({})).toBe('')
  })
})
