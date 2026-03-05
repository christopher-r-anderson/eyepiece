import { describe, expect, it } from 'vitest'
import {
  isPlainLeftClick,
  mapSupabaseAuthError,
  stripAuthSearchParams,
} from './auth.utils'

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

  it('does not mutate the original params object', () => {
    const params = { auth: 'token', next: '/dashboard', other: 'keep' }
    stripAuthSearchParams(params)
    expect(params).toEqual({ auth: 'token', next: '/dashboard', other: 'keep' })
  })
})

describe('mapSupabaseAuthError', () => {
  it('extracts the message from a Supabase-shaped error object', () => {
    const error = { message: 'Invalid login credentials' }
    expect(mapSupabaseAuthError(error)).toEqual({
      message: 'Invalid login credentials',
    })
  })

  it('returns the fallback message when error is null', () => {
    expect(mapSupabaseAuthError(null)).toEqual({
      message: 'An unknown error occurred',
    })
  })

  it('returns the fallback message when error is undefined', () => {
    expect(mapSupabaseAuthError(undefined)).toEqual({
      message: 'An unknown error occurred',
    })
  })

  it('returns the fallback message when error is a string', () => {
    expect(mapSupabaseAuthError('something went wrong')).toEqual({
      message: 'An unknown error occurred',
    })
  })

  it('returns the fallback message when error is a number', () => {
    expect(mapSupabaseAuthError(42)).toEqual({
      message: 'An unknown error occurred',
    })
  })

  it('returns the fallback message when error is an object without a message property', () => {
    expect(mapSupabaseAuthError({ code: 'AUTH_ERROR' })).toEqual({
      message: 'An unknown error occurred',
    })
  })

  it('works with a native Error instance', () => {
    const error = new Error('Token expired')
    expect(mapSupabaseAuthError(error)).toEqual({
      message: 'Token expired',
    })
  })
})

describe('isPlainLeftClick', () => {
  const plainLeft = {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
  }

  it('returns true for a plain left click with no modifiers', () => {
    expect(isPlainLeftClick(plainLeft)).toBe(true)
  })

  it('returns false when button is not 0', () => {
    expect(isPlainLeftClick({ ...plainLeft, button: 1 })).toBe(false)
    expect(isPlainLeftClick({ ...plainLeft, button: 2 })).toBe(false)
  })

  it('returns false when metaKey is pressed', () => {
    expect(isPlainLeftClick({ ...plainLeft, metaKey: true })).toBe(false)
  })

  it('returns false when ctrlKey is pressed', () => {
    expect(isPlainLeftClick({ ...plainLeft, ctrlKey: true })).toBe(false)
  })

  it('returns false when shiftKey is pressed', () => {
    expect(isPlainLeftClick({ ...plainLeft, shiftKey: true })).toBe(false)
  })

  it('returns false when altKey is pressed', () => {
    expect(isPlainLeftClick({ ...plainLeft, altKey: true })).toBe(false)
  })

  it('returns false when multiple modifiers are pressed', () => {
    expect(
      isPlainLeftClick({ ...plainLeft, ctrlKey: true, shiftKey: true }),
    ).toBe(false)
  })
})
