import { describe, expect, it } from 'vitest'
import { htmlToPlainText, paginationToRange } from './provider.utils'
import { paginationSchema } from '@/domain/pagination/pagination.schema'

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
