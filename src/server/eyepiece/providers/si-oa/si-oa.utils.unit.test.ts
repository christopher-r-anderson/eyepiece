import { describe, expect, it } from 'vitest'
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

describe('buildSioaSearchParams', () => {
  it('builds search params from query and pagination', () => {
    const params = buildSioaSearchParams('moon', {}, { page: 1, pageSize: 20 })

    expect(params).toEqual({
      q: 'moon AND online_media_type:Images AND media_usage:CC0 AND data_source:"National Air and Space Museum"',
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
      q: 'apollo AND online_media_type:Images AND media_usage:CC0 AND data_source:"National Air and Space Museum"',
      start: 10,
      rows: 10,
    })
  })

  it('handles page size variations', () => {
    const params = buildSioaSearchParams('space', {}, { page: 3, pageSize: 50 })

    expect(params).toEqual({
      q: 'space AND online_media_type:Images AND media_usage:CC0 AND data_source:"National Air and Space Museum"',
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
    expect(params.q).toContain('media_usage:CC0')
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
      url: url,
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

  function withMedia(media: Partial<SioaMediaItem>): SioaAssetItem {
    return createAssetItem({
      content: {
        descriptiveNonRepeating: {
          guid: 'guid-123',
          title: { label: 'Title', content: 'Apollo 11 Lunar Module' },
          record_ID: 'rec-123',
          unit_code: 'NASM',
          data_source: 'National Air and Space Museum',
          online_media: {
            media: [{ resources: [], usage: { access: 'CC0' }, ...media }],
            mediaCount: 1,
          },
          metadata_usage: { access: 'CC0' },
        },
      },
    })
  }

  it('scales the ladder from the delivery service at the declared size', () => {
    const result = mapAssetItem(
      withMedia({
        idsId: 'NASM-A19721168000',
        resources: [
          createResourceItem(
            'High-resolution JPEG',
            'https://example.com/orig.jpg',
            3000,
            2000,
          ),
          createResourceItem(
            'Screen Image',
            'https://example.com/standard.jpg',
          ),
        ],
      }),
    )

    expect(result.image?.width).toBe(3000)
    expect(result.image?.height).toBe(2000)
    expect(
      result.image?.renditions.map((rendition) => rendition.width),
    ).toEqual([2560, 1920, 1280, 960, 640, 320])
    expect(result.image?.renditions[0]).toEqual({
      href: 'https://ids.si.edu/ids/iiif/NASM-A19721168000/full/2560,/0/default.jpg',
      width: 2560,
      height: 1707,
    })
  })

  it('never asks the delivery service to upscale past the master', () => {
    const result = mapAssetItem(
      withMedia({
        idsId: 'NASM-small',
        resources: [
          createResourceItem(
            'High-resolution JPEG',
            'https://example.com/orig.jpg',
            900,
            600,
          ),
        ],
      }),
    )

    expect(
      result.image?.renditions.map((rendition) => rendition.width),
    ).toEqual([900, 640, 320])
  })

  it('takes the master size the adapter resolved when no resource declares one', () => {
    const result = mapAssetItem(
      withMedia({
        idsId: 'NASM-undeclared',
        resources: [
          {
            url: 'https://example.com/standard.jpg',
            label: 'Screen Image',
          },
        ],
      }),
      { width: 4000, height: 5000 },
    )

    expect(result.image?.width).toBe(4000)
    expect(result.image?.height).toBe(5000)
    expect(result.image?.renditions[0]?.href).toContain('/NASM-undeclared/')
  })

  it('ignores zero-dimension resources when reading the declared size', () => {
    const result = mapAssetItem(
      withMedia({
        idsId: 'NASM-zeroes',
        resources: [
          createResourceItem(
            'High-resolution JPEG',
            'https://example.com/orig.jpg',
            0,
            0,
          ),
          createResourceItem(
            'Screen Image',
            'https://example.com/standard.jpg',
            2400,
            1600,
          ),
        ],
      }),
    )

    expect(result.image?.width).toBe(2400)
  })

  it('falls back to the labelled resources when there is no ids id', () => {
    const result = mapAssetItem(
      withMedia({
        resources: [
          createResourceItem(
            'Screen Image',
            'https://example.com/standard.jpg',
            640,
            480,
          ),
        ],
      }),
    )

    expect(result.image).toEqual({
      width: 640,
      height: 480,
      renditions: [
        { href: 'https://example.com/standard.jpg', width: 640, height: 480 },
      ],
    })
  })

  it('leaves the image unset when online_media is missing', () => {
    const result = mapAssetItem(createAssetItem())

    expect(result.image).toBeUndefined()
  })

  it('skips restricted media in favor of the first CC0 one', () => {
    const item = withMedia({})
    item.content.descriptiveNonRepeating.online_media!.media = [
      {
        resources: [],
        usage: { access: 'Usage conditions apply' },
        idsId: 'restricted-id',
      },
      { resources: [], usage: { access: 'CC0' }, idsId: 'open-id' },
    ]

    const result = mapAssetItem(item, { width: 1000, height: 800 })

    expect(result.image?.renditions[0]?.href).toContain('open-id')
  })

  it('leaves the image unset when every media item is restricted', () => {
    const item = withMedia({
      usage: { access: 'Usage conditions apply' },
      idsId: 'restricted-id',
    })

    const result = mapAssetItem(item, { width: 1000, height: 800 })

    expect(result.image).toBeUndefined()
  })

  it('leaves the image unset when no resource can be laid out', () => {
    const result = mapAssetItem(
      withMedia({
        resources: [
          {
            url: 'https://example.com/standard.jpg',
            label: 'Screen Image',
          },
        ],
      }),
    )

    expect(result.image).toBeUndefined()
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
            ? {
                media: [{ resources: [], usage: { access: 'CC0' }, ...media }],
                mediaCount: 1,
              }
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

  it('carries the record link as the source url', () => {
    const result = mapAssetItem(parseRecord(contentWithAltFixture))

    expect(result.sourceUrl).toBe(
      'http://n2t.net/ark:/65665/nv90b4ee9e7-085f-4851-816c-084f47ad7b1c',
    )
  })

  it('leaves the source url unset when the record has no link', () => {
    const result = mapAssetItem(createTextItem({}))

    expect(result.sourceUrl).toBeUndefined()
  })
})
