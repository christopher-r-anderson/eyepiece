import { describe, expect, it } from 'vitest'
import { isPlainLeftClick, mapSupabaseAuthError } from './auth.utils'

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

describe('mapSupabaseAuthError codes', () => {
  it('carries the code and takes the app copy for known codes', () => {
    expect(
      mapSupabaseAuthError({
        message: 'Invalid login credentials',
        code: 'invalid_credentials',
      }),
    ).toEqual({
      code: 'invalid_credentials',
      message: 'Email or password is incorrect.',
    })
  })

  it('keeps the upstream message for unknown codes', () => {
    expect(
      mapSupabaseAuthError({
        message: 'Zone flux imminent',
        code: 'zone_flux',
      }),
    ).toEqual({ code: 'zone_flux', message: 'Zone flux imminent' })
  })
})
