import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  DEFAULT_PAGE_SIZE,
  createPaginatedCollectionSchema,
  paginateSchema,
  paginationSchema,
} from './pagination.schema'

describe('paginationSchema', () => {
  it('applies defaults when page and pageSize are omitted', () => {
    const pagination = paginationSchema.parse({})

    expect(pagination).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE })
  })

  it('coerces string params and enforces range', () => {
    const pagination = paginationSchema.parse({ page: '2', pageSize: '10' })

    expect(pagination).toEqual({ page: 2, pageSize: 10 })
  })

  it('rejects page less than 1', () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow()
  })

  it('rejects pageSize greater than 100', () => {
    expect(() => paginationSchema.parse({ pageSize: 101 })).toThrow()
  })
})

describe('paginateSchema', () => {
  it('extends a schema with pagination params', () => {
    const schema = paginateSchema(
      z.object({ query: z.string().min(1), providerId: z.string() }),
    )

    const parsed = schema.parse({ query: 'mars', providerId: 'nasa_ivl' })

    expect(parsed).toEqual({
      query: 'mars',
      providerId: 'nasa_ivl',
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    })
  })
})

describe('createPaginatedCollectionSchema', () => {
  it('creates a collection schema with nullable next page', () => {
    const schema = createPaginatedCollectionSchema(
      z.object({ id: z.string(), title: z.string() }),
    )

    const parsed = schema.parse({
      items: [{ id: 'a1', title: 'Apollo' }],
      pagination: { next: null, total: 1 },
    })

    expect(parsed.pagination.next).toBeNull()
    expect(parsed.pagination.total).toBe(1)
  })

  it('includes optional collection metadata when a collection schema is provided', () => {
    const schema = createPaginatedCollectionSchema(
      z.object({ id: z.string() }),
      z.object({ title: z.string() }),
    )

    const withCollection = schema.parse({
      items: [{ id: 'a1' }],
      pagination: { next: null, total: 1 },
      collection: { title: 'My Album' },
    })

    expect(withCollection.collection).toEqual({ title: 'My Album' })

    const withoutCollection = schema.parse({
      items: [],
      pagination: { next: null, total: 0 },
    })

    expect(withoutCollection.collection).toBeUndefined()
  })
})
