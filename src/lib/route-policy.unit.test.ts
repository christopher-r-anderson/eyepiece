import { describe, expect, it } from 'vitest'
import {
  AUTHENTICATED_ROUTE_POLICY,
  DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE,
  PRIVATE_ANONYMOUS_ROUTE_POLICY,
  PRIVATE_DOCUMENT_CACHE_CONTROL,
  PUBLIC_DOCUMENT_CACHE_CONTROL,
  PUBLIC_ROUTE_POLICY,
  getDocumentCacheControlHeader,
  getPrivateDocumentCacheControlHeader,
  getPublicDocumentCacheControlHeader,
  requireUserSupabaseClient,
} from './route-policy'

describe('getDocumentCacheControlHeader', () => {
  it('returns public cache-control for public policy', () => {
    expect(getDocumentCacheControlHeader(PUBLIC_ROUTE_POLICY)).toBe(
      PUBLIC_DOCUMENT_CACHE_CONTROL,
    )
  })

  it('returns private cache-control for authenticated policy', () => {
    expect(getDocumentCacheControlHeader(AUTHENTICATED_ROUTE_POLICY)).toBe(
      PRIVATE_DOCUMENT_CACHE_CONTROL,
    )
  })

  it('returns private cache-control for private-anonymous policy', () => {
    expect(getDocumentCacheControlHeader(PRIVATE_ANONYMOUS_ROUTE_POLICY)).toBe(
      PRIVATE_DOCUMENT_CACHE_CONTROL,
    )
  })

  it('uses an explicit public cache profile when provided', () => {
    expect(
      getDocumentCacheControlHeader(PUBLIC_ROUTE_POLICY, {
        maxAge: 0,
        sMaxAge: 60,
        staleWhileRevalidate: 120,
      }),
    ).toBe('public, max-age=0, s-maxage=60, stale-while-revalidate=120')
  })
})

describe('getPublicDocumentCacheControlHeader', () => {
  it('returns the default public cache profile when no profile is provided', () => {
    expect(getPublicDocumentCacheControlHeader()).toBe(
      `public, max-age=${DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE.maxAge}, s-maxage=${DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE.sMaxAge}, stale-while-revalidate=${DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE.staleWhileRevalidate}`,
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

describe('requireUserSupabaseClient', () => {
  it('throws when policy forbids user client access', () => {
    expect(() =>
      requireUserSupabaseClient({
        userSupabaseClient: {} as any,
        routePolicy: PUBLIC_ROUTE_POLICY,
      }),
    ).toThrow('User Supabase client access is forbidden for this route policy.')
  })

  it('throws when policy allows but userSupabaseClient is null', () => {
    expect(() =>
      requireUserSupabaseClient({
        userSupabaseClient: null,
        routePolicy: AUTHENTICATED_ROUTE_POLICY,
      }),
    ).toThrow('User Supabase client is not available in this route context.')
  })

  it('returns the client when policy allows and client is present', () => {
    const client = {} as any
    expect(
      requireUserSupabaseClient({
        userSupabaseClient: client,
        routePolicy: AUTHENTICATED_ROUTE_POLICY,
      }),
    ).toBe(client)
  })
})
