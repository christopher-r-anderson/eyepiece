import { describe, expect, it } from 'vitest'
import { NOT_FOUND_IMAGE } from '../../provider.utils'
import { buildSioaSearchParams, mapAssetItem } from './si-oa.utils'
import type {
  SioaAssetItem,
  SioaMediaItem,
  SioaResourceItem,
} from '@/integrations/si-oa/types'
import contentWithAltFixture from '@/integrations/si-oa/__fixtures__/content.ld1-1643400021979-1643400026497-0.json'
import contentEmptyAltFixture from '@/integrations/si-oa/__fixtures__/content.ld1-1643400021979-1643400025766-0.json'
import contentPhysicalOnlyFixture from '@/integrations/si-oa/__fixtures__/content.ld1-1643400021979-1643400027025-0.json'
import {
  sioaAssetItemResponseSchema,
  sioaAssetItemSchema,
} from '@/integrations/si-oa/types'
import { SI_OA_PROVIDER_ID } from '@/domain/provider/provider.schema'

describe('buildSioaSearchParams', () => {
  it('builds search params from query and pagination', () => {
    const params = buildSioaSearchParams('moon', {}, { page: 1, pageSize: 20 })

    expect(params).toEqual({
      q: 'moon AND online_media_type:Images AND data_source:"National Air and Space Museum"',
      start: 0,
      rows: 20,
    })
  })

  it('maps pagination to start and rows for second page', () => {
    const params = buildSioaSearchParams(
      'apollo',
      {},
      { page: 2, pageSize: 10 },
    )

    expect(params).toEqual({
      q: 'apollo AND online_media_type:Images AND data_source:"National Air and Space Museum"',
      start: 10,
      rows: 10,
    })
  })

  it('handles page size variations', () => {
    const params = buildSioaSearchParams('space', {}, { page: 3, pageSize: 50 })

    expect(params).toEqual({
      q: 'space AND online_media_type:Images AND data_source:"National Air and Space Museum"',
      start: 100,
      rows: 50,
    })
  })

  it('ignores filters parameter (SI OA uses hardcoded filters)', () => {
    const params = buildSioaSearchParams(
      'shuttle',
      { someFilter: 'value' } as any,
      { page: 1, pageSize: 20 },
    )

    expect(params.q).toContain('online_media_type:Images')
    expect(params.q).toContain('data_source:"National Air and Space Museum"')
  })
})

describe('mapAssetItem', () => {
  function createResourceItem(
    label: string,
    url: string = 'https://example.com/image.jpg',
    width: number = 640,
    height: number = 480,
  ): SioaResourceItem {
    return {
      url: url as any,
      label,
      width,
      height,
    }
  }

  function createAssetItem(
    overrides: Partial<SioaAssetItem> = {},
  ): SioaAssetItem {
    return {
      id: 'asset-123',
      title: 'Apollo 11 Lunar Module',
      unitCode: 'NASM',
      type: 'object',
      url: 'nasm.si.edu/asset-123',
      hash: 'abc123',
      docSignature: 'sig123',
      content: {
        descriptiveNonRepeating: {
          guid: 'guid-123',
          title: { label: 'Title', content: 'Apollo 11 Lunar Module' },
          record_ID: 'rec-123',
          unit_code: 'NASM',
          data_source: 'National Air and Space Museum',
          metadata_usage: {
            access: 'CC0',
          },
        },
      },
      ...overrides,
    }
  }

  it('maps asset item with all image resources present', () => {
    const assetItem = createAssetItem({
      content: {
        descriptiveNonRepeating: {
          guid: 'guid-123',
          title: { label: 'Title', content: 'Apollo 11 Lunar Module' },
          record_ID: 'rec-123',
          unit_code: 'NASM',
          data_source: 'National Air and Space Museum',
          online_media: {
            media: [
              {
                resources: [
                  createResourceItem(
                    'High-resolution JPEG',
                    'https://example.com/orig.jpg',
                    2048,
                    1536,
                  ),
                  createResourceItem(
                    'Screen Image',
                    'https://example.com/standard.jpg',
                    640,
                    480,
                  ),
                  createResourceItem(
                    'Thumbnail Image',
                    'https://example.com/thumb.jpg',
                    160,
                    120,
                  ),
                ],
              },
            ],
            mediaCount: 1,
          },
          metadata_usage: {
            access: 'CC0',
          },
        },
      },
    })

    const result = mapAssetItem(assetItem)

    expect(result).toEqual({
      title: 'Apollo 11 Lunar Module',
      description: undefined,
      alt: undefined,
      key: {
        externalId: 'asset-123',
        providerId: SI_OA_PROVIDER_ID,
      },
      // the screen rendition serves as both preview roles
      thumbnail: {
        href: 'https://example.com/standard.jpg',
        width: 640,
        height: 480,
      },
      image: {
        href: 'https://example.com/standard.jpg',
        width: 640,
        height: 480,
      },
      original: {
        href: 'https://example.com/orig.jpg',
        width: 2048,
        height: 1536,
      },
    })
  })

  it('falls back to NOT_FOUND_IMAGE when online_media is missing', () => {
    const assetItem = createAssetItem({
      content: {
        descriptiveNonRepeating: {
          guid: 'guid-123',
          title: { label: 'Title', content: 'Title' },
          record_ID: 'rec-123',
          unit_code: 'NASM',
          data_source: 'National Air and Space Museum',
          metadata_usage: {
            access: 'CC0',
          },
        },
      },
    })

    const result = mapAssetItem(assetItem)

    expect(result.thumbnail).toEqual(NOT_FOUND_IMAGE)
    expect(result.image).toEqual(NOT_FOUND_IMAGE)
    expect(result.original).toEqual(NOT_FOUND_IMAGE)
  })

  it('falls back to NOT_FOUND_IMAGE when resources array is empty', () => {
    const assetItem = createAssetItem({
      content: {
        descriptiveNonRepeating: {
          guid: 'guid-123',
          title: { label: 'Title', content: 'Title' },
          record_ID: 'rec-123',
          unit_code: 'NASM',
          data_source: 'National Air and Space Museum',
          online_media: {
            media: [{ resources: [] }],
            mediaCount: 0,
          },
          metadata_usage: {
            access: 'CC0',
          },
        },
      },
    })

    const result = mapAssetItem(assetItem)

    expect(result.thumbnail).toEqual(NOT_FOUND_IMAGE)
  })

  it('falls back to NOT_FOUND_IMAGE for missing specific resource type', () => {
    const assetItem = createAssetItem({
      content: {
        descriptiveNonRepeating: {
          guid: 'guid-123',
          title: { label: 'Title', content: 'Title' },
          record_ID: 'rec-123',
          unit_code: 'NASM',
          data_source: 'National Air and Space Museum',
          online_media: {
            media: [
              {
                resources: [
                  createResourceItem(
                    'Screen Image',
                    'https://example.com/standard.jpg',
                    640,
                    480,
                  ),
                  // Note: No High-resolution JPEG or Thumbnail Image
                ],
              },
            ],
            mediaCount: 1,
          },
          metadata_usage: {
            access: 'CC0',
          },
        },
      },
    })

    const result = mapAssetItem(assetItem)

    expect(result.image).toEqual({
      href: 'https://example.com/standard.jpg',
      width: 640,
      height: 480,
    })
    expect(result.thumbnail).toEqual(result.image)
    expect(result.original).toEqual(NOT_FOUND_IMAGE)
  })

  it('takes the aspect ratio from a dimensioned sibling resource', () => {
    const assetItem = createAssetItem({
      content: {
        descriptiveNonRepeating: {
          guid: 'guid-123',
          title: { label: 'Title', content: 'Title' },
          record_ID: 'rec-123',
          unit_code: 'NASM',
          data_source: 'National Air and Space Museum',
          online_media: {
            media: [
              {
                resources: [
                  {
                    url: 'https://example.com/orig.jpg' as any,
                    label: 'High-resolution JPEG',
                    width: 3000,
                    height: 2000,
                  },
                  {
                    url: 'https://example.com/standard.jpg' as any,
                    label: 'Screen Image',
                  },
                ],
              },
            ],
            mediaCount: 1,
          },
          metadata_usage: {
            access: 'CC0',
          },
        },
      },
    })

    const result = mapAssetItem(assetItem)

    expect(result.thumbnail).toEqual({
      href: 'https://example.com/standard.jpg',
      width: 3000,
      height: 2000,
    })
  })

  it('ignores zero-dimension siblings', () => {
    const assetItem = createAssetItem({
      content: {
        descriptiveNonRepeating: {
          guid: 'guid-123',
          title: { label: 'Title', content: 'Title' },
          record_ID: 'rec-123',
          unit_code: 'NASM',
          data_source: 'National Air and Space Museum',
          online_media: {
            media: [
              {
                resources: [
                  {
                    url: 'https://example.com/orig.jpg' as any,
                    label: 'High-resolution JPEG',
                    width: 0,
                    height: 0,
                  },
                  {
                    url: 'https://example.com/standard.jpg' as any,
                    label: 'Screen Image',
                  },
                ],
              },
            ],
            mediaCount: 1,
          },
          metadata_usage: {
            access: 'CC0',
          },
        },
      },
    })

    const result = mapAssetItem(assetItem)

    expect(result.thumbnail).toEqual({
      href: 'https://example.com/standard.jpg',
      width: NOT_FOUND_IMAGE.width,
      height: NOT_FOUND_IMAGE.height,
    })
  })

  it('uses NOT_FOUND_IMAGE when resource has null or invalid image data', () => {
    const assetItem = createAssetItem({
      content: {
        descriptiveNonRepeating: {
          guid: 'guid-123',
          title: { label: 'Title', content: 'Title' },
          record_ID: 'rec-123',
          unit_code: 'NASM',
          data_source: 'National Air and Space Museum',
          online_media: {
            media: [
              {
                resources: [
                  { ...createResourceItem('Screen Image'), url: null as any },
                ],
              },
            ],
            mediaCount: 1,
          },
          metadata_usage: {
            access: 'CC0',
          },
        },
      },
    })

    const result = mapAssetItem(assetItem)

    expect(result.image).toEqual(NOT_FOUND_IMAGE)
  })

  it('handles missing width and height with defaults from NOT_FOUND_IMAGE', () => {
    const assetItem = createAssetItem({
      content: {
        descriptiveNonRepeating: {
          guid: 'guid-123',
          title: { label: 'Title', content: 'Title' },
          record_ID: 'rec-123',
          unit_code: 'NASM',
          data_source: 'National Air and Space Museum',
          online_media: {
            media: [
              {
                resources: [
                  {
                    url: 'https://example.com/image.jpg' as any,
                    label: 'Screen Image',
                    width: undefined,
                    height: undefined,
                  } as SioaResourceItem,
                ],
              },
            ],
            mediaCount: 1,
          },
          metadata_usage: {
            access: 'CC0',
          },
        },
      },
    })

    const result = mapAssetItem(assetItem)

    expect(result.image.href).toBe('https://example.com/image.jpg')
    expect(result.image.width).toBe(NOT_FOUND_IMAGE.width)
    expect(result.image.height).toBe(NOT_FOUND_IMAGE.height)
  })
})

describe('mapAssetItem text', () => {
  function parseRecord(fixture: unknown) {
    return sioaAssetItemResponseSchema.parse(fixture).response
  }

  function createTextItem({
    freetext,
    media,
  }: {
    freetext?: Record<string, Array<{ label?: string; content?: unknown }>>
    media?: Partial<SioaMediaItem>
  }): SioaAssetItem {
    return sioaAssetItemSchema.parse({
      id: 'asset-123',
      title: 'Lunar Module Ascent Engine',
      unitCode: 'NASM',
      type: 'object',
      url: 'nasm.si.edu/asset-123',
      hash: 'abc123',
      docSignature: 'sig123',
      content: {
        freetext,
        descriptiveNonRepeating: {
          title: { label: 'Title', content: 'Lunar Module Ascent Engine' },
          record_ID: 'rec-123',
          unit_code: 'NASM',
          data_source: 'National Air and Space Museum',
          online_media: media
            ? { media: [{ resources: [], ...media }], mediaCount: 1 }
            : undefined,
          metadata_usage: { access: 'CC0' },
        },
      },
    })
  }

  it('takes alt and description from a real record', () => {
    const result = mapAssetItem(parseRecord(contentWithAltFixture))

    expect(result.alt).toBe(
      'White, metal, bell-shaped nozzle with electrical wires and control unit on top.',
    )
    expect(result.description).toMatch(
      /^This is the Lunar Module Ascent Engine used to lift up/,
    )
  })

  it('joins every summary note into the description', () => {
    const result = mapAssetItem(parseRecord(contentWithAltFixture))

    expect(result.description?.split('\n\n')).toHaveLength(2)
  })

  it('leaves alt unset when the record supplies an empty one', () => {
    const result = mapAssetItem(parseRecord(contentEmptyAltFixture))

    expect(result.alt).toBeUndefined()
    expect(result.description).toBeTruthy()
  })

  it('leaves the description unset when only a physical description exists', () => {
    const result = mapAssetItem(parseRecord(contentPhysicalOnlyFixture))

    expect(result.alt).toBe(
      'Rounded box-shaped silver-canvas covered World War I USMC Balloon Basket',
    )
    expect(result.description).toBeUndefined()
  })

  it('falls back to the extended accessibility description without a summary', () => {
    const result = mapAssetItem(
      createTextItem({
        freetext: { notes: [{ label: 'Brief Description', content: 'Brief' }] },
        media: { extDescrAccessibility: 'Wool; 4 brass buttons; open collar.' },
      }),
    )

    expect(result.description).toBe('Wool; 4 brass buttons; open collar.')
  })

  it('falls back to the extended description when the summary repeats the title', () => {
    const result = mapAssetItem(
      createTextItem({
        freetext: {
          notes: [{ label: 'Summary', content: 'Lunar Module Ascent Engine' }],
        },
        media: { extDescrAccessibility: 'Bell-shaped nozzle on a test stand.' },
      }),
    )

    expect(result.description).toBe('Bell-shaped nozzle on a test stand.')
  })

  it('drops a description that only repeats the title', () => {
    const result = mapAssetItem(
      createTextItem({
        freetext: {
          notes: [{ label: 'Summary', content: 'Lunar Module Ascent Engine ' }],
        },
      }),
    )

    expect(result.description).toBeUndefined()
  })

  it('keeps a supplied alt that resembles the title', () => {
    const result = mapAssetItem(
      createTextItem({
        media: { altTextAccessibility: 'lunar  module ascent engine' },
      }),
    )

    expect(result.alt).toBe('lunar  module ascent engine')
  })

  it('survives freetext entries that are not strings', () => {
    const result = mapAssetItem(
      createTextItem({
        freetext: {
          notes: [
            { label: 'Summary', content: { '#text': 'nested' } },
            { label: 'Summary', content: 'The usable summary.' },
          ],
          physicalDescription: [{ content: 'Overall metal' }],
        },
      }),
    )

    expect(result.description).toBe('The usable summary.')
  })

  it('maps a record with no freetext and no media', () => {
    const result = mapAssetItem(createTextItem({}))

    expect(result.description).toBeUndefined()
    expect(result.alt).toBeUndefined()
  })
})
