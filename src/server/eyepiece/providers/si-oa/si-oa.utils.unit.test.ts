import { describe, expect, it } from 'vitest'
import { NOT_FOUND_IMAGE } from '../../provider.utils'
import { buildSioaSearchParams, mapAssetItem } from './si-oa.utils'
import type {
  SioaAssetItem,
  SioaResourceItem,
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
      description: 'Apollo 11 Lunar Module',
      key: {
        externalId: 'asset-123',
        providerId: SI_OA_PROVIDER_ID,
      },
      mediaType: 'image',
      thumbnail: {
        href: 'https://example.com/thumb.jpg',
        width: 160,
        height: 120,
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
    expect(result.thumbnail).toEqual(NOT_FOUND_IMAGE)
    expect(result.original).toEqual(NOT_FOUND_IMAGE)
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
