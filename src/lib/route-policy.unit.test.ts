import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE,
  PRIVATE_DOCUMENT_CACHE_CONTROL,
  PUBLIC_DOCUMENT_CACHE_CONTROL,
  getPrivateDocumentCacheControlHeader,
  getPublicDocumentCacheControlHeader,
} from './route-policy'

describe('getPublicDocumentCacheControlHeader', () => {
  it('returns the default public cache profile when no profile is provided', () => {
    expect(getPublicDocumentCacheControlHeader()).toBe(
      `public, max-age=${DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE.maxAge}, s-maxage=${DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE.sMaxAge}, stale-while-revalidate=${DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE.staleWhileRevalidate}`,
    )
  })

  it('matches the exported default public cache-control constant', () => {
    expect(getPublicDocumentCacheControlHeader()).toBe(
      PUBLIC_DOCUMENT_CACHE_CONTROL,
    )
  })

  it('returns a header for custom public cache profile values', () => {
    expect(
      getPublicDocumentCacheControlHeader({
        maxAge: 10,
        sMaxAge: 20,
        staleWhileRevalidate: 30,
      }),
    ).toBe('public, max-age=10, s-maxage=20, stale-while-revalidate=30')
  })

  it('throws when a profile value is negative', () => {
    expect(() =>
      getPublicDocumentCacheControlHeader({
        maxAge: -1,
        sMaxAge: 20,
        staleWhileRevalidate: 30,
      }),
    ).toThrow('maxAge must be a non-negative integer.')
  })

  it('throws when a profile value is not an integer', () => {
    expect(() =>
      getPublicDocumentCacheControlHeader({
        maxAge: 1.5,
        sMaxAge: 20,
        staleWhileRevalidate: 30,
      }),
    ).toThrow('maxAge must be a non-negative integer.')
  })
})

describe('getPrivateDocumentCacheControlHeader', () => {
  it('returns private no-store cache-control', () => {
    expect(getPrivateDocumentCacheControlHeader()).toBe(
      PRIVATE_DOCUMENT_CACHE_CONTROL,
    )
  })
})
