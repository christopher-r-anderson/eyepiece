import { describe, expect, it } from 'vitest'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '../provider/provider.schema'
import { YEAR_MAX, YEAR_MIN } from './providers/nasa-ivl-filters'
import { searchFiltersSchema } from './search.schema'

describe('searchFiltersSchema', () => {
  it('parses NASA filters with coerced year values', () => {
    const parsed = searchFiltersSchema.parse({
      providerId: NASA_IVL_PROVIDER_ID,
      filters: {
        mediaType: 'image',
        yearStart: '2001',
        yearEnd: '2012',
      },
    })

    expect(parsed).toEqual({
      providerId: NASA_IVL_PROVIDER_ID,
      filters: {
        mediaType: 'image',
        yearStart: 2001,
        yearEnd: 2012,
      },
    })
  })

  it('parses SI OA filters', () => {
    const parsed = searchFiltersSchema.parse({
      providerId: SI_OA_PROVIDER_ID,
      filters: {},
    })

    expect(parsed).toEqual({ providerId: SI_OA_PROVIDER_ID, filters: {} })
  })

  it('rejects NASA-only filters when provider is SI OA', () => {
    expect(() =>
      searchFiltersSchema.parse({
        providerId: SI_OA_PROVIDER_ID,
        filters: { mediaType: 'image' },
      }),
    ).toThrow()
  })

  it('rejects a yearStart below the minimum year', () => {
    expect(() =>
      searchFiltersSchema.parse({
        providerId: NASA_IVL_PROVIDER_ID,
        filters: { yearStart: YEAR_MIN - 1 },
      }),
    ).toThrow()
  })

  it('rejects a yearEnd above the maximum year', () => {
    expect(() =>
      searchFiltersSchema.parse({
        providerId: NASA_IVL_PROVIDER_ID,
        filters: { yearEnd: YEAR_MAX + 1 },
      }),
    ).toThrow()
  })

  it('rejects unknown filter keys for NASA in strict mode', () => {
    expect(() =>
      searchFiltersSchema.parse({
        providerId: NASA_IVL_PROVIDER_ID,
        filters: { unknownKey: 'value' },
      }),
    ).toThrow()
  })
})
