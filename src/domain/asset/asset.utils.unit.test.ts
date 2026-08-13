import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '../provider/provider.schema'
import {
  assetKeyIsEqual,
  toAssetKeyString,
  toFallbackSrc,
  toSocialImage,
  toSrcSet,
} from './asset.utils'

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

const nasaRendition = (width: number, name: string) => ({
  href: `https://images-assets.nasa.gov/image/PIA24439/PIA24439~${name}.jpg`,
  width,
  height: Math.round(width / 2),
})

const nasaTransform = (width: number, name = 'large') =>
  `/.netlify/images?url=${encodeURIComponent(
    `/img/nasa/image/PIA24439/PIA24439~${name}.jpg`,
  )}&w=${width}`

const widths = (srcSet: string) =>
  srcSet.split(', ').map((candidate) => parseInt(candidate.split(' ')[1]!))

describe('toSrcSet', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const image = {
    width: 4000,
    height: 2000,
    renditions: [
      nasaRendition(1920, 'large'),
      nasaRendition(1280, 'medium'),
      nasaRendition(640, 'small'),
    ],
  }

  it('scales every candidate from the widest rendition', () => {
    const srcSet = toSrcSet(image, 506)
    for (const candidate of srcSet.split(', ')) {
      expect(candidate).toContain('PIA24439~large.jpg')
    }
  })

  it('stops the ladder at the first width covering 2x the slot', () => {
    expect(widths(toSrcSet(image, 506))).toEqual([1280, 960, 640, 480, 320])
  })

  it('never emits a width above the source rendition', () => {
    const narrow = { ...image, renditions: [nasaRendition(800, 'small')] }
    expect(widths(toSrcSet(narrow, 1120))).toEqual([800, 640, 480, 320])
  })

  it('reaches the ladder top for a detail-width slot on a wide source', () => {
    const wide = { ...image, renditions: [nasaRendition(4000, 'orig')] }
    expect(widths(toSrcSet(wide, 1120))).toEqual([
      2560, 1920, 1280, 960, 640, 480, 320,
    ])
  })

  it('keeps per-rendition candidates for hrefs outside the delivery map', () => {
    const fallbackImage = {
      width: 1200,
      height: 600,
      renditions: [
        {
          href: 'https://ids.si.edu/ids/download?id=X',
          width: 1200,
          height: 600,
        },
        {
          href: 'https://ids.si.edu/ids/delivery?id=X&max=640',
          width: 640,
          height: 320,
        },
      ],
    }
    expect(toSrcSet(fallbackImage, 506)).toBe(
      'https://ids.si.edu/ids/download?id=X 1200w, https://ids.si.edu/ids/delivery?id=X&max=640 640w',
    )
  })

  it('keeps per-rendition origin candidates when delivery is disabled', () => {
    vi.stubEnv('VITE_IMAGE_CDN_ENABLED', 'false')
    expect(toSrcSet(image, 506)).toBe(
      `${nasaRendition(1920, 'large').href} 1920w, ${nasaRendition(1280, 'medium').href} 1280w, ${nasaRendition(640, 'small').href} 640w`,
    )
  })
})

describe('toFallbackSrc', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const image = {
    width: 4000,
    height: 2000,
    renditions: [nasaRendition(1920, 'large'), nasaRendition(640, 'small')],
  }

  it('serves the narrowest rendition from its own file, not the widest source', () => {
    expect(toFallbackSrc(image)).toBe(nasaTransform(640, 'small'))
  })

  it('serves the narrowest origin href when delivery is disabled', () => {
    vi.stubEnv('VITE_IMAGE_CDN_ENABLED', 'false')
    expect(toFallbackSrc(image)).toBe(nasaRendition(640, 'small').href)
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
