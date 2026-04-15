import { describe, expect, it } from 'vitest'
import {
  calculateNextPage,
  htmlToPlainText,
  paginationToRange,
} from './provider.utils'
import { paginationSchema } from '@/domain/pagination/pagination.schema'

describe('calculateNextPage', () => {
  it('returns the next page when more items exist beyond the current coverage', () => {
    const pagination = paginationSchema.parse({})

    const nextPage = calculateNextPage(pagination, 24, 30)

    expect(nextPage).toEqual(2)
  })

  it('returns null when the current coverage meets the total item count', () => {
    const pagination = paginationSchema.parse({ page: 2, pageSize: 24 })

    const nextPage = calculateNextPage(pagination, 24, 48)

    expect(nextPage).toBeNull()
  })

  it('handles partially filled pages when additional items remain', () => {
    const pagination = paginationSchema.parse({ page: 3, pageSize: 10 })

    const nextPage = calculateNextPage(pagination, 5, 35)

    expect(nextPage).toEqual(4)
  })
})

describe('paginationToRange', () => {
  it('returns the default range for the first page', () => {
    const pagination = paginationSchema.parse({})

    const range = paginationToRange(pagination)

    expect(range).toEqual({ start: 0, end: 23 })
  })

  it('returns the correct range for subsequent pages', () => {
    const pagination = paginationSchema.parse({ page: 2, pageSize: 50 })

    const range = paginationToRange(pagination)

    expect(range).toEqual({ start: 50, end: 99 })
  })

  it('handles a page size of one', () => {
    const pagination = paginationSchema.parse({ page: 4, pageSize: 1 })

    const range = paginationToRange(pagination)

    expect(range).toEqual({ start: 3, end: 3 })
  })
})

describe('htmlToPlainText', () => {
  it('preserves line breaks from block tags and strips markup', () => {
    const text = htmlToPlainText(
      '<p>Hello<br>World</p><div><strong>NASA</strong> Archive</div>',
    )

    expect(text).toBe('Hello\nWorld\nNASA Archive')
  })

  it('collapses large consecutive newlines to paragraph spacing', () => {
    const text = htmlToPlainText('<p>One</p><p></p><p></p><p>Two</p>')

    expect(text).toBe('One\n\nTwo')
  })
})
