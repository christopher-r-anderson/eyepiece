import { describe, expect, it } from 'vitest'
import {
  searchPageParamsSchema,
  toCanonicalUrlParams,
  toSearchPageParams,
  toSearchPageState,
} from './search-page-params'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'
import { searchFiltersSchema } from '@/domain/search/search.schema'

describe('searchPageParamsSchema', () => {
  it('P1: missing provider parses to the query alone (all scope)', () => {
    expect(searchPageParamsSchema.parse({ q: 'moon' })).toEqual({ q: 'moon' })
  })

  it('P2: unknown provider is dropped', () => {
    expect(
      searchPageParamsSchema.parse({ q: 'moon', providerId: 'bogus' }),
    ).toEqual({ q: 'moon' })
  })

  it('P3: valid provider without filter params keeps the provider', () => {
    expect(
      searchPageParamsSchema.parse({
        q: 'moon',
        providerId: NASA_IVL_PROVIDER_ID,
      }),
    ).toEqual({ q: 'moon', providerId: NASA_IVL_PROVIDER_ID })
  })

  it('P4: an invalid filter value is dropped without discarding valid ones', () => {
    expect(
      searchPageParamsSchema.parse({
        q: 'moon',
        providerId: NASA_IVL_PROVIDER_ID,
        yearStart: 'apollo',
        yearEnd: 1990,
      }),
    ).toEqual({
      q: 'moon',
      providerId: NASA_IVL_PROVIDER_ID,
      yearEnd: 1990,
    })
  })

  it('P4: an out-of-range year is dropped', () => {
    expect(
      searchPageParamsSchema.parse({
        q: 'moon',
        providerId: NASA_IVL_PROVIDER_ID,
        yearStart: 1800,
      }),
    ).toEqual({ q: 'moon', providerId: NASA_IVL_PROVIDER_ID })
  })

  it.each([['' as const], [true], [[1990, 2000]]])(
    'P4: non-numeric year %j is dropped',
    (yearStart) => {
      expect(
        searchPageParamsSchema.parse({
          q: 'moon',
          providerId: NASA_IVL_PROVIDER_ID,
          yearStart,
        }),
      ).toEqual({ q: 'moon', providerId: NASA_IVL_PROVIDER_ID })
    },
  )

  it('P4: provider-incompatible filters are dropped, provider kept', () => {
    expect(
      searchPageParamsSchema.parse({
        q: 'moon',
        providerId: SI_OA_PROVIDER_ID,
        yearStart: 1990,
      }),
    ).toEqual({ q: 'moon', providerId: SI_OA_PROVIDER_ID })
  })

  it('a legacy mediaType param is dropped silently', () => {
    expect(
      searchPageParamsSchema.parse({
        q: 'moon',
        providerId: NASA_IVL_PROVIDER_ID,
        mediaType: 'image',
        yearStart: 1990,
      }),
    ).toEqual({
      q: 'moon',
      providerId: NASA_IVL_PROVIDER_ID,
      yearStart: 1990,
    })
  })

  it('P4: an inverted year range is dropped as a pair', () => {
    expect(
      searchPageParamsSchema.parse({
        q: 'moon',
        providerId: NASA_IVL_PROVIDER_ID,
        yearStart: 2001,
        yearEnd: 2000,
      }),
    ).toEqual({ q: 'moon', providerId: NASA_IVL_PROVIDER_ID })
  })

  it('P4: junk params are dropped', () => {
    expect(
      searchPageParamsSchema.parse({
        q: 'moon',
        providerId: NASA_IVL_PROVIDER_ID,
        utm_source: 'newsletter',
        page: 3,
      }),
    ).toEqual({ q: 'moon', providerId: NASA_IVL_PROVIDER_ID })
  })

  it('P4: legacy nested filters objects are dropped, provider kept', () => {
    expect(
      searchPageParamsSchema.parse({
        q: 'moon',
        providerId: NASA_IVL_PROVIDER_ID,
        filters: { yearStart: 1990 },
      }),
    ).toEqual({ q: 'moon', providerId: NASA_IVL_PROVIDER_ID })
  })

  it.each([[{}], [{ q: '' }], [{ q: '   ' }], [{ q: undefined }]])(
    'P5: missing or empty query %j parses to an empty string',
    (input) => {
      expect(searchPageParamsSchema.parse(input)).toEqual({ q: '' })
    },
  )

  it('trims surrounding whitespace from the query', () => {
    expect(searchPageParamsSchema.parse({ q: ' moon ' })).toEqual({
      q: 'moon',
    })
  })

  it('P6: a numeric query is stringified', () => {
    expect(searchPageParamsSchema.parse({ q: 123 })).toEqual({ q: '123' })
  })

  it('P6: a non-stringifiable query becomes an empty string', () => {
    expect(searchPageParamsSchema.parse({ q: true })).toEqual({ q: '' })
  })

  it('coerces string years like the strict schema does', () => {
    expect(
      searchPageParamsSchema.parse({
        q: 'apollo',
        providerId: NASA_IVL_PROVIDER_ID,
        yearStart: '2000',
      }),
    ).toEqual({
      q: 'apollo',
      providerId: NASA_IVL_PROVIDER_ID,
      yearStart: 2000,
    })
  })

  it('tolerates auth-modal params without emitting them', () => {
    expect(
      searchPageParamsSchema.parse({ q: 'moon', auth: 'login', fp: 1 }),
    ).toEqual({ q: 'moon' })
  })

  const idempotenceInputs: Array<Record<string, unknown>> = [
    {},
    { q: 'moon' },
    { q: 123, providerId: 'bogus', junk: true },
    { q: 'moon', providerId: NASA_IVL_PROVIDER_ID },
    {
      q: 'moon',
      providerId: NASA_IVL_PROVIDER_ID,
      mediaType: 'image',
      yearStart: 1990,
      utm_source: 'x',
    },
    { q: 'moon', providerId: SI_OA_PROVIDER_ID, mediaType: 'image' },
    {
      q: 'moon',
      providerId: NASA_IVL_PROVIDER_ID,
      yearStart: 2001,
      yearEnd: 2000,
    },
  ]

  it.each(idempotenceInputs)(
    'is idempotent for %j (canonical output re-parses unchanged)',
    (input) => {
      const once = searchPageParamsSchema.parse(input)
      expect(searchPageParamsSchema.parse(once)).toEqual(once)
    },
  )

  it.each(idempotenceInputs)(
    'provider-scoped output for %j satisfies the strict filters schema',
    (input) => {
      const { scope } = toSearchPageState(searchPageParamsSchema.parse(input))
      if (scope.scope === 'provider') {
        expect(() => searchFiltersSchema.parse(scope.filters)).not.toThrow()
      }
    },
  )
})

describe('toSearchPageState', () => {
  it('builds the all scope when no provider is present', () => {
    expect(toSearchPageState({ q: 'moon' })).toEqual({
      q: 'moon',
      scope: { scope: 'all' },
    })
  })

  it('builds a provider scope with nested domain filters', () => {
    expect(
      toSearchPageState({
        q: 'moon',
        providerId: NASA_IVL_PROVIDER_ID,
        yearStart: 1990,
      }),
    ).toEqual({
      q: 'moon',
      scope: {
        scope: 'provider',
        filters: {
          providerId: NASA_IVL_PROVIDER_ID,
          filters: { yearStart: 1990 },
        },
      },
    })
  })

  it('defaults provider filters to an empty object', () => {
    expect(
      toSearchPageState({ q: 'moon', providerId: SI_OA_PROVIDER_ID }),
    ).toEqual({
      q: 'moon',
      scope: {
        scope: 'provider',
        filters: { providerId: SI_OA_PROVIDER_ID, filters: {} },
      },
    })
  })
})

describe('toSearchPageParams', () => {
  it('trims the query', () => {
    expect(toSearchPageParams(' moon ', { scope: 'all' })).toEqual({
      q: 'moon',
    })
  })

  it('round-trips canonical params through the scope model', () => {
    const paramsTable = [
      { q: 'moon' },
      { q: 'moon', providerId: SI_OA_PROVIDER_ID },
      {
        q: 'moon',
        providerId: NASA_IVL_PROVIDER_ID,
        yearStart: 1990,
        yearEnd: 2001,
      },
    ] as const

    for (const params of paramsTable) {
      const state = toSearchPageState(params)
      expect(toSearchPageParams(state.q, state.scope)).toEqual(params)
    }
  })
})

describe('toCanonicalUrlParams', () => {
  it('omits an empty query', () => {
    expect(toCanonicalUrlParams({ q: '' })).toEqual({})
  })

  it('keeps a non-empty query and filters', () => {
    expect(
      toCanonicalUrlParams({
        q: 'moon',
        providerId: NASA_IVL_PROVIDER_ID,
        yearStart: 1990,
      }),
    ).toEqual({ q: 'moon', providerId: NASA_IVL_PROVIDER_ID, yearStart: 1990 })
  })
})
