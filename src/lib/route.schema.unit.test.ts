import { describe, expect, it } from 'vitest'
import { redirectSearchParamsSchema } from './route.schema'

function parseNext(next: string | undefined) {
  return redirectSearchParamsSchema.parse({ next }).next
}

describe('redirectSearchParamsSchema', () => {
  it('accepts relative paths with search and hash', () => {
    expect(parseNext('/favorites')).toBe('/favorites')
    expect(parseNext('/search?q=moon#top')).toBe('/search?q=moon#top')
  })

  it('rejects absolute and protocol-relative urls', () => {
    expect(parseNext('https://evil.example/')).toBeUndefined()
    expect(parseNext('//evil.example')).toBeUndefined()
  })

  it('rejects backslash spellings browsers normalize off-origin', () => {
    // a Location of '/\\evil.example' is followed as '//evil.example'
    expect(parseNext('/\\evil.example')).toBeUndefined()
    expect(parseNext('/\\/evil.example')).toBeUndefined()
  })

  it('rejects non-path values', () => {
    expect(parseNext('javascript:alert(1)')).toBeUndefined()
    expect(parseNext('favorites')).toBeUndefined()
    expect(parseNext(undefined)).toBeUndefined()
  })
})
