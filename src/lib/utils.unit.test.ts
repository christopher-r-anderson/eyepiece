import { describe, expect, it } from 'vitest'
import { rawSearchOfHref, urlToNextParam } from './utils'

describe('urlToNextParam', () => {
  it('strips redirect and one-shot form params from url', () => {
    const url = '/some/path?next=/other&formError=code&status=sent&query=foo'
    const result = urlToNextParam(url)
    expect(result).toBe('/some/path?query=foo')
  })

  it('handles urls without params', () => {
    const url = '/simple/path'
    const result = urlToNextParam(url)
    expect(result).toBe('/simple/path')
  })

  it('handles urls with hash', () => {
    const url = '/path?next=/other#section'
    const result = urlToNextParam(url)
    expect(result).toBe('/path#section')
  })

  it('is idempotent', () => {
    const url = '/some/path?next=/other&status=sent&query=foo'
    const firstResult = urlToNextParam(url)
    const secondResult = urlToNextParam(firstResult)

    expect(firstResult).toBe('/some/path?query=foo')
    expect(secondResult).toBe(firstResult)
  })
})

describe('rawSearchOfHref', () => {
  it('returns the verbatim query substring', () => {
    expect(rawSearchOfHref('/search?q=moon&a=1')).toBe('?q=moon&a=1')
  })

  it('preserves a bare trailing delimiter as its own spelling', () => {
    expect(rawSearchOfHref('/search?')).toBe('?')
  })

  it('returns empty without a query', () => {
    expect(rawSearchOfHref('/search')).toBe('')
  })

  it('stops at the fragment', () => {
    expect(rawSearchOfHref('/search?q=moon#panel')).toBe('?q=moon')
  })

  it('ignores a question mark inside the fragment', () => {
    expect(rawSearchOfHref('/search#panel?tab=1')).toBe('')
  })
})
