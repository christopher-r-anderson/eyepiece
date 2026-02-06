import { describe, expect, it } from 'vitest'
import { stripAuthSearchParams } from './util'

describe('stripAuthSearchParams', () => {
  it('removes auth related params', () => {
    const params = {
      auth: 'some-token',
      next: '/dashboard',
      fp: '1',
      other: 'keep-this',
      page: 1,
    }
    const result = stripAuthSearchParams(params)
    expect(result).toEqual({
      other: 'keep-this',
      page: 1,
    })
    expect(result).not.toHaveProperty('auth')
    expect(result).not.toHaveProperty('next')
    expect(result).not.toHaveProperty('fp')
  })

  it('keeps other params untouched', () => {
    const params = {
      search: 'query',
      sort: 'desc',
    }
    const result = stripAuthSearchParams(params)
    expect(result).toEqual(params)
  })
})
