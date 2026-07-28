import { describe, expect, it } from 'vitest'
import { calculateNasaAlbumRequests, mapMediaItem } from './nasa-ivl.utils'
import type { NasaMediaItem } from '@/integrations/nasa-ivl/types'
import titleAsDescriptionFixture from '@/integrations/nasa-ivl/__fixtures__/search.nasa-id.S68-27041.json'
import descriptionFixture from '@/integrations/nasa-ivl/__fixtures__/search.nasa-id.PIA24439.json'
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
