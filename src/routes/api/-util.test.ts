import { describe, expect, it } from 'vitest'
import { calculateNextPage } from './-util'
import { eyepiecePaginationSchema } from '@/lib/api/eyepiece/types'

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
