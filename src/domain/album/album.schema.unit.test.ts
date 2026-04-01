import { describe, expect, it } from 'vitest'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '../provider/provider.schema'
import { albumKeySchema, albumKeyStringSchema } from './album.schema'
import { toAlbumKeyString } from './album.utils'

describe('albumKeyStringSchema', () => {
  it('parses valid key strings for each provider', () => {
    expect(albumKeyStringSchema.parse('nasa_ivl-AS09-20-3064')).toBe(
      'nasa_ivl-AS09-20-3064',
    )
    expect(albumKeyStringSchema.parse('si_oa-collection-1234')).toBe(
      'si_oa-collection-1234',
    )
  })

  it('rejects an unknown provider prefix', () => {
    expect(() =>
      albumKeyStringSchema.parse('bad_provider-some-album'),
    ).toThrow()
  })

  it('rejects a key with an empty external id', () => {
    expect(() => albumKeyStringSchema.parse('nasa_ivl-')).toThrow()
  })
})

describe('albumKeySchema', () => {
  it('parses a valid key object', () => {
    const key = albumKeySchema.parse({
      providerId: NASA_IVL_PROVIDER_ID,
      externalId: 'AS09-20-3064',
    })

    expect(key).toEqual({
      providerId: NASA_IVL_PROVIDER_ID,
      externalId: 'AS09-20-3064',
    })
  })

  it('rejects an unknown providerId', () => {
    expect(() =>
      albumKeySchema.parse({ providerId: 'other', externalId: 'id1' }),
    ).toThrow()
  })
})

describe('toAlbumKeyString', () => {
  it('produces the correct key string with the delimiter', () => {
    expect(
      toAlbumKeyString({
        providerId: SI_OA_PROVIDER_ID,
        externalId: 'col-456',
      }),
    ).toBe('si_oa-col-456')
  })
})
