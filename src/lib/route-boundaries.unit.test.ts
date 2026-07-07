import { describe, expect, it, vi } from 'vitest'
import {
  authenticatedBoundary,
  privateAnonymousBoundary,
  publicBoundary,
} from './route-boundaries'
import { requireAuthenticated } from './guards'
import {
  PRIVATE_DOCUMENT_CACHE_CONTROL,
  PUBLIC_DOCUMENT_CACHE_CONTROL,
} from './route-policy'

vi.mock('./guards', () => ({
  requireAuthenticated: vi.fn(),
}))

describe('publicBoundary', () => {
  it('returns public document cache headers and no beforeLoad', () => {
    const options = publicBoundary()

    expect(options.headers()).toEqual({
      'Cache-Control': PUBLIC_DOCUMENT_CACHE_CONTROL,
      'Netlify-CDN-Cache-Control': expect.stringContaining('durable'),
    })
    expect('beforeLoad' in options).toBe(false)
  })

  it('passes through non-policy route options', () => {
    const component = () => null
    const options = publicBoundary({ component })

    expect(options.component).toBe(component)
    expect(options.headers()['Cache-Control']).toBe(
      PUBLIC_DOCUMENT_CACHE_CONTROL,
    )
  })

  it('rejects policy-reserved keys at the type level', () => {
    // @ts-expect-error headers is policy-reserved; boundaries own it
    publicBoundary({ headers: () => ({ 'Cache-Control': 'public' }) })
    // @ts-expect-error beforeLoad is policy-reserved; boundaries own it
    publicBoundary({ beforeLoad: () => ({}) })
  })
})

describe('authenticatedBoundary', () => {
  it('returns private cache headers and wires the auth guard', () => {
    const options = authenticatedBoundary()

    expect(options.headers()).toEqual({
      'Cache-Control': PRIVATE_DOCUMENT_CACHE_CONTROL,
    })
    expect(options.beforeLoad).toBe(requireAuthenticated)
  })

  it('merges policy keys last so they cannot be replaced', () => {
    const component = () => null
    const options = authenticatedBoundary({ component })

    expect(options.component).toBe(component)
    expect(options.beforeLoad).toBe(requireAuthenticated)
    expect(options.headers()['Cache-Control']).toBe(
      PRIVATE_DOCUMENT_CACHE_CONTROL,
    )
  })

  it('rejects policy-reserved keys at the type level', () => {
    // @ts-expect-error beforeLoad is policy-reserved; boundaries own it
    authenticatedBoundary({ beforeLoad: () => ({}) })
  })
})

describe('privateAnonymousBoundary', () => {
  it('returns private cache headers and no beforeLoad', () => {
    const options = privateAnonymousBoundary()

    expect(options.headers()).toEqual({
      'Cache-Control': PRIVATE_DOCUMENT_CACHE_CONTROL,
    })
    expect('beforeLoad' in options).toBe(false)
  })
})
