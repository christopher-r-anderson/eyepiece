import { describe, expect, it } from 'vitest'
import { SHOWCASE_CURATION } from './collections.showcase'
import { validateShowcaseCuration } from './collections.showcase-provisioning'
import type { ShowcaseCuration } from './collections.showcase'

function curationWith(
  overrides: Partial<ShowcaseCuration> = {},
): ShowcaseCuration {
  return {
    user: {
      id: 'c081d76d-0949-4dd0-8041-475fad3f8d7c',
      email: 'showcase@example.com',
      displayName: 'showcase',
    },
    collections: [
      {
        id: 'eef5ca48-ba1f-44f0-85e8-5c8d0d6755dd',
        name: 'a collection',
        visibility: 'public',
        items: [{ providerId: 'nasa_ivl', externalId: 'a-1' }],
      },
    ],
    ...overrides,
  }
}

describe('SHOWCASE_CURATION', () => {
  it('is a valid curation', () => {
    expect(() => validateShowcaseCuration(SHOWCASE_CURATION)).not.toThrow()
  })

  // the homepage links showcase collections directly; a private one would
  // 404 for every visitor
  it('only contains public collections', () => {
    for (const collection of SHOWCASE_CURATION.collections) {
      expect(collection.visibility).toBe('public')
    }
  })
})

describe('validateShowcaseCuration', () => {
  it('rejects duplicate collection ids', () => {
    const collection = curationWith().collections[0]
    expect(() =>
      validateShowcaseCuration(
        curationWith({ collections: [collection, { ...collection }] }),
      ),
    ).toThrow(/duplicate showcase collection id/)
  })

  it('rejects duplicate items within a collection', () => {
    const collection = curationWith().collections[0]
    expect(() =>
      validateShowcaseCuration(
        curationWith({
          collections: [
            {
              ...collection,
              items: [...collection.items, ...collection.items],
            },
          ],
        }),
      ),
    ).toThrow(/duplicate item/)
  })

  it('rejects an empty collection', () => {
    const collection = curationWith().collections[0]
    expect(() =>
      validateShowcaseCuration(
        curationWith({ collections: [{ ...collection, items: [] }] }),
      ),
    ).toThrow(/no items/)
  })

  it('rejects a blank collection name', () => {
    const collection = curationWith().collections[0]
    expect(() =>
      validateShowcaseCuration(
        curationWith({ collections: [{ ...collection, name: '  ' }] }),
      ),
    ).toThrow()
  })
})
