import { describe, expect, it } from 'vitest'
import { urlToNextParam } from './util'

describe('urlToNextParam', () => {
  it('strips auth params from url', () => {
    const url = '/some/path?auth=token&next=/other&fp=123&query=foo'
    const result = urlToNextParam(url)
    expect(result).toBe('/some/path?query=foo')
  })

  it('handles urls without params', () => {
    const url = '/simple/path'
    const result = urlToNextParam(url)
    expect(result).toBe('/simple/path')
  })

  it('handles urls with hash', () => {
    const url = '/path?auth=bad#section'
    const result = urlToNextParam(url)
    expect(result).toBe('/path#section')
  })

  it('is idempotent', () => {
    const url = '/some/path?auth=token&next=/other&query=foo'
    const firstResult = urlToNextParam(url)
    const secondResult = urlToNextParam(firstResult)

    expect(firstResult).toBe('/some/path?query=foo')
    expect(secondResult).toBe(firstResult)
  })
})
