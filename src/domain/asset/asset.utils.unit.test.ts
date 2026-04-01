import { describe, expect, it } from 'vitest'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '../provider/provider.schema'
import { assetKeyIsEqual, toAssetKeyString } from './asset.utils'

describe('toAssetKeyString', () => {
  it('joins providerId and externalId with the key delimiter', () => {
    expect(
      toAssetKeyString({
        providerId: NASA_IVL_PROVIDER_ID,
        externalId: 'abc123',
      }),
    ).toBe('nasa_ivl-abc123')
  })
})

describe('assetKeyIsEqual', () => {
  it('returns true when both fields match', () => {
    expect(
      assetKeyIsEqual(
        { providerId: NASA_IVL_PROVIDER_ID, externalId: 'abc' },
        { providerId: NASA_IVL_PROVIDER_ID, externalId: 'abc' },
      ),
    ).toBe(true)
  })

  it('returns false when externalId differs', () => {
    expect(
      assetKeyIsEqual(
        { providerId: NASA_IVL_PROVIDER_ID, externalId: 'abc' },
        { providerId: NASA_IVL_PROVIDER_ID, externalId: 'xyz' },
      ),
    ).toBe(false)
  })

  it('returns false when providerId differs', () => {
    expect(
      assetKeyIsEqual(
        { providerId: NASA_IVL_PROVIDER_ID, externalId: 'abc' },
        { providerId: SI_OA_PROVIDER_ID, externalId: 'abc' },
      ),
    ).toBe(false)
  })
})
