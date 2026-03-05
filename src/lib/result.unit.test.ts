import { describe, expect, it } from 'vitest'
import {
  Err,
  Ok,
  resultIsError,
  resultIsSuccess,
  throwFromErrorResult,
  unwrapOrThrow,
} from './result'

describe('Ok', () => {
  it('returns a success result with the provided data', () => {
    const result = Ok({ foo: 'bar' })
    expect(result).toEqual({ kind: 'success', data: { foo: 'bar' } })
  })

  it('works with falsy values', () => {
    expect(Ok(null)).toEqual({ kind: 'success', data: null })
    expect(Ok(undefined)).toEqual({ kind: 'success', data: undefined })
    expect(Ok(0)).toEqual({ kind: 'success', data: 0 })
    expect(Ok(false)).toEqual({ kind: 'success', data: false })
    expect(Ok('')).toEqual({ kind: 'success', data: '' })
  })

  it('works with void / undefined explicitly (common usage)', () => {
    const result = Ok(undefined)
    expect(result.kind).toBe('success')
  })
})

describe('Err', () => {
  it('returns an error result with the provided error', () => {
    const result = Err({ message: 'something went wrong' })
    expect(result).toEqual({
      kind: 'error',
      error: { message: 'something went wrong' },
    })
  })

  it('preserves optional fields: code, fieldErrors, cause', () => {
    const cause = new Error('original')
    const result = Err({
      message: 'bad input',
      code: 'INVALID_INPUT',
      fieldErrors: { email: 'Invalid email' },
      cause,
    })
    expect(result.error.code).toBe('INVALID_INPUT')
    expect(result.error.fieldErrors).toEqual({ email: 'Invalid email' })
    expect(result.error.cause).toBe(cause)
  })
})

describe('resultIsSuccess', () => {
  it('returns true for a success result', () => {
    expect(resultIsSuccess(Ok('value'))).toBe(true)
  })

  it('returns false for an error result', () => {
    expect(resultIsSuccess(Err({ message: 'oops' }))).toBe(false)
  })

  it('acts as a type guard narrowing to SuccessResult', () => {
    const result = Ok(42)
    if (resultIsSuccess(result)) {
      // TypeScript should allow accessing result.data here
      expect(result.data).toBe(42)
    }
  })
})

describe('resultIsError', () => {
  it('returns true for an error result', () => {
    expect(resultIsError(Err({ message: 'oops' }))).toBe(true)
  })

  it('returns false for a success result', () => {
    expect(resultIsError(Ok('value'))).toBe(false)
  })

  it('acts as a type guard narrowing to ErrorResult', () => {
    const result = Err({ message: 'bad' })
    if (resultIsError(result)) {
      expect(result.error.message).toBe('bad')
    }
  })
})

describe('resultIsSuccess and resultIsError are mutually exclusive', () => {
  it('exactly one is true for a success result', () => {
    const result = Ok(1)
    expect(resultIsSuccess(result)).toBe(true)
    expect(resultIsError(result)).toBe(false)
  })

  it('exactly one is true for an error result', () => {
    const result = Err({ message: 'x' })
    expect(resultIsSuccess(result)).toBe(false)
    expect(resultIsError(result)).toBe(true)
  })
})

describe('throwFromErrorResult', () => {
  it('always throws an AppException', () => {
    expect(() =>
      throwFromErrorResult({ message: 'something went wrong' }),
    ).toThrow('something went wrong')
  })

  it('thrown AppException has the correct name and message', () => {
    try {
      throwFromErrorResult({ message: 'boom' })
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).name).toBe('AppException')
      expect((e as Error).message).toBe('boom')
    }
  })

  it('thrown AppException carries appError on the instance', () => {
    const appError = { message: 'boom', code: 'MY_CODE' as const }
    try {
      throwFromErrorResult(appError)
      expect.fail('should have thrown')
    } catch (e) {
      expect((e as any).appError).toBe(appError)
    }
  })

  it('always throws AppException even when cause is an Error instance', () => {
    const original = new Error('root cause')
    const appError = { message: 'wrapped', cause: original }
    try {
      throwFromErrorResult(appError)
      expect.fail('should have thrown')
    } catch (e) {
      expect((e as Error).name).toBe('AppException')
      expect((e as Error).message).toBe('wrapped')
    }
  })

  it('preserves the original error as the native cause on the thrown AppException', () => {
    const original = new Error('root cause')
    try {
      throwFromErrorResult({ message: 'wrapped', cause: original })
      expect.fail('should have thrown')
    } catch (e) {
      expect((e as Error).cause).toBe(original)
    }
  })

  it('preserves a non-Error cause as the native cause on the thrown AppException', () => {
    const cause = 'a string cause'
    try {
      throwFromErrorResult({ message: 'wrapped', cause })
      expect.fail('should have thrown')
    } catch (e) {
      expect((e as Error).name).toBe('AppException')
      expect((e as Error).cause).toBe(cause)
    }
  })

  it('thrown AppException is an instanceof Error', () => {
    expect(() => throwFromErrorResult({ message: 'x' })).toThrow(Error)
  })
})

describe('unwrapOrThrow', () => {
  it('returns data from a success result', () => {
    expect(unwrapOrThrow(Ok('hello'))).toBe('hello')
  })

  it('returns falsy data correctly', () => {
    expect(unwrapOrThrow(Ok(null))).toBeNull()
    expect(unwrapOrThrow(Ok(0))).toBe(0)
    expect(unwrapOrThrow(Ok(false))).toBe(false)
  })

  it('throws when given an error result', () => {
    expect(() => unwrapOrThrow(Err({ message: 'failed' }))).toThrow('failed')
  })

  it('throws with the error message from the result', () => {
    const result = Err({ message: 'specific error message' })
    expect(() => unwrapOrThrow(result)).toThrow('specific error message')
  })

  it('preserves the original Error as native cause on the thrown AppException', () => {
    const original = new Error('original')
    const result = Err({ message: 'wrapped', cause: original })
    try {
      unwrapOrThrow(result)
      expect.fail('should have thrown')
    } catch (e) {
      expect((e as Error).name).toBe('AppException')
      expect((e as Error).cause).toBe(original)
    }
  })
})
