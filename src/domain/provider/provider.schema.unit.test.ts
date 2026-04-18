import { describe, expect, it } from 'vitest'
import {
  NASA_IVL_PROVIDER_ID,
  PROVIDER_CAPABILITIES,
  SI_OA_PROVIDER_ID,
  providerIdSchema,
  providerSupportsAlbums,
  providerSupportsMetadata,
} from './provider.schema'

describe('providerIdSchema', () => {
  it('accepts supported provider IDs', () => {
    expect(providerIdSchema.parse(NASA_IVL_PROVIDER_ID)).toBe(
      NASA_IVL_PROVIDER_ID,
    )
    expect(providerIdSchema.parse(SI_OA_PROVIDER_ID)).toBe(SI_OA_PROVIDER_ID)
  })

  it('includes the rejected value in validation errors', () => {
    expect(() => providerIdSchema.parse('bad_provider')).toThrow(
      "received 'bad_provider'",
    )
  })

  it('exposes provider capability helpers', () => {
    expect(PROVIDER_CAPABILITIES[NASA_IVL_PROVIDER_ID]).toEqual({
      albums: true,
      metadata: true,
    })
    expect(PROVIDER_CAPABILITIES[SI_OA_PROVIDER_ID]).toEqual({})
    expect(providerSupportsAlbums(NASA_IVL_PROVIDER_ID)).toBe(true)
    expect(providerSupportsAlbums(SI_OA_PROVIDER_ID)).toBe(false)
    expect(providerSupportsMetadata(NASA_IVL_PROVIDER_ID)).toBe(true)
    expect(providerSupportsMetadata(SI_OA_PROVIDER_ID)).toBe(false)
  })
})
