import { describe, expect, it } from 'vitest'
import {
  calculateNasaAlbumRequests,
  clampNextPageToSearchDepthCap,
  mapMediaItem,
} from './nasa-ivl.utils'
import type {
  NasaMediaItem,
  NasaMediaLink,
} from '@/integrations/nasa-ivl/types'
import titleAsDescriptionFixture from '@/integrations/nasa-ivl/__fixtures__/search.nasa-id.S68-27041.json'
import descriptionFixture from '@/integrations/nasa-ivl/__fixtures__/search.nasa-id.PIA24439.json'
import noAlternateFixture from '@/integrations/nasa-ivl/__fixtures__/search.nasa-id.PIA01249.json'
import { nasaMediaCollectionResponseSchema } from '@/integrations/nasa-ivl/types'

describe('mapMediaItem text', () => {
  function parseItem(fixture: unknown) {
    return nasaMediaCollectionResponseSchema.parse(fixture).collection.items[0]
  }

  function createItem(data: Partial<NasaMediaItem>) {
    return {
      data: [
        {
          center: 'JPL',
          date_created: '2021-07-19T00:00:00Z',
          media_type: 'image' as const,
          nasa_id: 'nasa-123',
          title: 'Apollo Footprint',
          ...data,
        },
      ],
      links: [],
    }
  }

  it('maps a real description', () => {
    const result = mapMediaItem(parseItem(descriptionFixture))

    expect(result.description).toMatch(/^Buzz Aldrin took this iconic image/)
  })

  it('drops a description that only repeats the title', () => {
    const result = mapMediaItem(parseItem(titleAsDescriptionFixture))

    expect(result.title).toBe('Apollo 6 (AS-502) Pacific Recovery')
    expect(result.description).toBeUndefined()
  })

  it('leaves the description unset when the record has none', () => {
    const result = mapMediaItem(createItem({}))

    expect(result.description).toBeUndefined()
  })

  it('strips markup before comparing against the title', () => {
    const result = mapMediaItem(
      createItem({ description: '<p>Apollo Footprint</p>' }),
    )

    expect(result.description).toBeUndefined()
  })

  it('builds a source url from the id, escaping the ones with spaces', () => {
    const result = mapMediaItem(
      createItem({ nasa_id: 'APOLLO 50th_FULL COLOR_300DPI' }),
    )

    expect(result.sourceUrl).toBe(
      'https://images.nasa.gov/details/APOLLO%2050th_FULL%20COLOR_300DPI',
    )
  })

  it('drops hidden upstream album names and keeps the rest', () => {
    const result = mapMediaItem(
      createItem({ album: ['Test', 'Apollo-at-50', 'HST'] }),
    )

    expect(result.albums).toEqual([
      { providerId: 'nasa_ivl', externalId: 'Apollo-at-50' },
    ])
  })

  it('leaves albums unset when only hidden names remain', () => {
    const result = mapMediaItem(createItem({ album: ['Test'] }))

    expect(result.albums).toBeUndefined()
  })
})

describe('mapMediaItem renditions', () => {
  function parseItem(fixture: unknown) {
    return nasaMediaCollectionResponseSchema.parse(fixture).collection.items[0]
  }

  function withLinks(links: Array<NasaMediaLink>) {
    return {
      data: [
        {
          center: 'JPL',
          date_created: '2021-07-19T00:00:00Z',
          media_type: 'image' as const,
          nasa_id: 'nasa-123',
          title: 'Apollo Footprint',
        },
      ],
      links,
    }
  }

  const link = (
    rel: string,
    href: string,
    width: number,
    height: number,
    size?: number,
  ): NasaMediaLink => ({ rel, href, render: 'image', width, height, size })

  it('orders the ladder widest first', () => {
    const result = mapMediaItem(parseItem(descriptionFixture))

    const widths =
      result.image?.renditions.map((rendition) => rendition.width) ?? []
    expect(widths).toEqual([...widths].sort((a, b) => b - a))
  })

  it('serves the original when the record has no alternates', () => {
    const result = mapMediaItem(parseItem(noAlternateFixture))

    expect(result.image?.renditions).toEqual([
      {
        href: 'https://images-assets.nasa.gov/image/PIA01249/PIA01249~orig.jpg',
        width: 335,
        height: 335,
      },
    ])
  })

  it('leaves out an original too heavy to hand to a visitor', () => {
    const result = mapMediaItem(
      withLinks([
        link('preview', 'https://example.com/a~thumb.jpg', 640, 480, 40_000),
        link(
          'canonical',
          'https://example.com/a~orig.jpg',
          8000,
          6000,
          40_000_000,
        ),
      ]),
    )

    expect(result.image?.renditions).toEqual([
      { href: 'https://example.com/a~thumb.jpg', width: 640, height: 480 },
    ])
    // the ladder drops it, but it is still the record's real size
    expect(result.image).toMatchObject({ width: 8000, height: 6000 })
  })

  it('leaves out a TIFF original whatever it weighs', () => {
    const result = mapMediaItem(
      withLinks([
        link('preview', 'https://example.com/a~thumb.jpg', 640, 480, 40_000),
        link('canonical', 'https://example.com/a~orig.tif', 900, 700, 90_000),
      ]),
    )

    expect(result.image?.renditions.map((rendition) => rendition.href)).toEqual(
      ['https://example.com/a~thumb.jpg'],
    )
  })

  it('falls through to the preview when the record has no canonical', () => {
    const result = mapMediaItem(
      withLinks([
        link('preview', 'https://example.com/a~thumb.jpg', 300, 200, 9_000),
      ]),
    )

    expect(result.image).toEqual({
      width: 300,
      height: 200,
      renditions: [
        { href: 'https://example.com/a~thumb.jpg', width: 300, height: 200 },
      ],
    })
  })

  it('escapes the spaces in an id so a srcset can carry the href', () => {
    const result = mapMediaItem(
      withLinks([
        link(
          'preview',
          'https://images-assets.nasa.gov/image/Moon to Mars/Moon to Mars~thumb.jpg',
          640,
          480,
          40_000,
        ),
      ]),
    )

    expect(result.image?.renditions[0]?.href).toBe(
      'https://images-assets.nasa.gov/image/Moon%20to%20Mars/Moon%20to%20Mars~thumb.jpg',
    )
  })

  it('leaves the image unset when nothing can be laid out', () => {
    const result = mapMediaItem(withLinks([]))

    expect(result.image).toBeUndefined()
  })

  // KSC-20221116-PH-ILW01_0008: the camera file is unrotated landscape while
  // every rendition a visitor sees is stored portrait
  it('trusts the ladder aspect when the canonical disagrees on orientation', () => {
    const result = mapMediaItem(
      withLinks([
        link('preview', 'https://example.com/a~thumb.jpg', 426, 640, 12_000),
        link(
          'alternate',
          'https://example.com/a~large.jpg',
          1280,
          1920,
          72_000,
        ),
        link(
          'canonical',
          'https://example.com/a~orig.jpg',
          6720,
          4480,
          3_879_731,
        ),
      ]),
    )

    expect(result.image).toMatchObject({ width: 1280, height: 1920 })
  })

  it('keeps a rotated original out of the ladder even under the byte cap', () => {
    const result = mapMediaItem(
      withLinks([
        link('preview', 'https://example.com/a~thumb.jpg', 426, 640, 12_000),
        link(
          'alternate',
          'https://example.com/a~large.jpg',
          1280,
          1920,
          72_000,
        ),
        link(
          'canonical',
          'https://example.com/a~orig.jpg',
          6720,
          4480,
          2_000_000,
        ),
      ]),
    )

    expect(result.image).toMatchObject({ width: 1280, height: 1920 })
    expect(
      result.image?.renditions.map((rendition) => rendition.href),
    ).not.toContain('https://example.com/a~orig.jpg')
  })
})

describe('calculateNasaAlbumRequests', () => {
  it('handles simple case at beginning of first page', () => {
    // Page 1, size 20 -> items 0-19
    const result = calculateNasaAlbumRequests(1, 20)
    expect(result).toEqual([{ page: 1, sliceStart: 0, sliceEnd: 20 }])
  })

  it('handles simple case in middle of first page', () => {
    // Page 2, size 20 -> items 20-39
    const result = calculateNasaAlbumRequests(2, 20)
    expect(result).toEqual([{ page: 1, sliceStart: 20, sliceEnd: 40 }])
  })

  it('handles matching size at first page', () => {
    // Page 1, size 100 -> items 0-99
    const result = calculateNasaAlbumRequests(1, 100)
    expect(result).toEqual([{ page: 1, sliceStart: 0, sliceEnd: 100 }])
  })

  it('handles boundary crossing', () => {
    // Custom page size to force crossing
    // Page 2, size 90.
    // Start = 90. End = 180.
    // NASA Page 1 (0-99), NASA Page 2 (100-199).
    // Page 1: 90-100 (10 items)
    // Page 2: 0-80 (80 items) -> Total 90.

    const result = calculateNasaAlbumRequests(2, 90)
    expect(result).toEqual([
      { page: 1, sliceStart: 90, sliceEnd: 100 },
      { page: 2, sliceStart: 0, sliceEnd: 80 },
    ])
  })

  it('handles exact boundary end', () => {
    // Start 80, size 20 -> 80-100 (indices 80-99).
    // Should only be Page 1.
    // Eyepiece page 5, size 20.
    const result = calculateNasaAlbumRequests(5, 20)
    expect(result).toEqual([{ page: 1, sliceStart: 80, sliceEnd: 100 }])
  })

  it('handles exact boundary start', () => {
    // Start 100, size 20 -> 100-120.
    // Should only be Page 2.
    // Eyepiece page 6, size 20.
    const result = calculateNasaAlbumRequests(6, 20)
    expect(result).toEqual([{ page: 2, sliceStart: 0, sliceEnd: 20 }])
  })
})

describe('clampNextPageToSearchDepthCap', () => {
  it('passes null through', () => {
    expect(clampNextPageToSearchDepthCap(null, 24)).toBeNull()
  })

  it('keeps a next page whose window ends inside the cap', () => {
    // page 416 of 24 ends at result 9,984
    expect(clampNextPageToSearchDepthCap(416, 24)).toBe(416)
  })

  it('drops a next page whose window straddles the cap', () => {
    // page 417 of 24 covers offsets 9984-10007
    expect(clampNextPageToSearchDepthCap(417, 24)).toBeNull()
  })

  it('keeps the page that ends exactly at the cap', () => {
    expect(clampNextPageToSearchDepthCap(100, 100)).toBe(100)
    expect(clampNextPageToSearchDepthCap(101, 100)).toBeNull()
  })
})
