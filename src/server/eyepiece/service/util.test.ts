import { describe, expect, it } from 'vitest'
import { calculateNextPage, paginationToRange } from './util'
import { eyepiecePaginationSchema } from '@/lib/eyepiece-api-client/types'

describe('calculateNextPage', () => {
  it('returns the next page when more items exist beyond the current coverage', () => {
    const pagination = eyepiecePaginationSchema.parse({})

    const nextPage = calculateNextPage(pagination, 24, 30)

    expect(nextPage).toEqual(2)
  })

  it('returns undefined when the current coverage meets the total item count', () => {
    const pagination = eyepiecePaginationSchema.parse({ page: 2, pageSize: 24 })

    const nextPage = calculateNextPage(pagination, 24, 48)

    expect(nextPage).toBeUndefined()
  })

  it('handles partially filled pages when additional items remain', () => {
    const pagination = eyepiecePaginationSchema.parse({ page: 3, pageSize: 10 })

    const nextPage = calculateNextPage(pagination, 5, 35)

    expect(nextPage).toEqual(4)
  })
})

describe('paginationToRange', () => {
  it('returns the default range for the first page', () => {
    const pagination = eyepiecePaginationSchema.parse({})

    const range = paginationToRange(pagination)

    expect(range).toEqual({ start: 0, end: 23 })
  })

  it('returns the correct range for subsequent pages', () => {
    const pagination = eyepiecePaginationSchema.parse({ page: 2, pageSize: 50 })

    const range = paginationToRange(pagination)

    expect(range).toEqual({ start: 50, end: 99 })
  })

  it('handles a page size of one', () => {
    const pagination = eyepiecePaginationSchema.parse({ page: 4, pageSize: 1 })

    const range = paginationToRange(pagination)

    expect(range).toEqual({ start: 3, end: 3 })
  })
})
