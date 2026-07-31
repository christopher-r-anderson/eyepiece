import { describe, expect, it } from 'vitest'
import { calculateNextPage } from './pagination.utils'
import { paginationSchema } from './pagination.schema'

describe('calculateNextPage', () => {
  it('returns the next page when the total extends past this window', () => {
    const pagination = paginationSchema.parse({})

    expect(calculateNextPage(pagination, 30)).toEqual(2)
  })

  it('returns null when the total ends exactly at this window', () => {
    const pagination = paginationSchema.parse({ page: 2, pageSize: 24 })

    expect(calculateNextPage(pagination, 48)).toBeNull()
  })

  it('returns null when the total ends inside this window', () => {
    // the case where counting delivered items goes wrong: a short upstream
    // page (say 4 of 24) still leaves nothing beyond this window
    const pagination = paginationSchema.parse({ page: 5, pageSize: 24 })

    expect(calculateNextPage(pagination, 100)).toBeNull()
  })

  it('returns the next page when the total ends inside a later window', () => {
    const pagination = paginationSchema.parse({ page: 4, pageSize: 24 })

    expect(calculateNextPage(pagination, 100)).toEqual(5)
  })

  it('returns null for an empty result set', () => {
    const pagination = paginationSchema.parse({})

    expect(calculateNextPage(pagination, 0)).toBeNull()
  })
})
