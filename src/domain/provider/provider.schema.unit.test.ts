import { describe, expect, it } from 'vitest'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
  providerIdSchema,
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
})
