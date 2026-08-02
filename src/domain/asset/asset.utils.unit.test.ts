import { describe, expect, it } from 'vitest'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '../provider/provider.schema'
import { assetKeyIsEqual, toAssetKeyString, toSocialImage } from './asset.utils'

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

describe('toSocialImage', () => {
  const rendition = (width: number, height: number) => ({
    href: `https://example.test/${width}.jpg`,
    width,
    height,
  })

  it('picks the widest rendition within the size bound', () => {
    const image = {
      width: 4000,
      height: 2000,
      renditions: [
        rendition(1920, 960),
        rendition(1280, 640),
        rendition(640, 320),
      ],
    }
    expect(toSocialImage(image)).toEqual({
      url: 'https://example.test/1280.jpg',
      width: 1280,
      height: 640,
    })
  })

  it('falls back to the narrowest when every rendition exceeds the bound', () => {
    const image = {
      width: 8000,
      height: 4000,
      renditions: [rendition(6000, 3000), rendition(3000, 1500)],
    }
    expect(toSocialImage(image)).toEqual({
      url: 'https://example.test/3000.jpg',
      width: 3000,
      height: 1500,
    })
  })
})
