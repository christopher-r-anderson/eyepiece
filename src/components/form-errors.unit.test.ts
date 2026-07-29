import { describe, expect, it } from 'vitest'
import { FORM_ERROR_COPY, formErrorCopy } from './form-errors'

describe('formErrorCopy', () => {
  it('maps known codes to their copy', () => {
    expect(formErrorCopy('invalid_credentials')).toBe(
      'Email or password is incorrect.',
    )
    expect(formErrorCopy('invalid_input')).toBe(FORM_ERROR_COPY.invalid_input)
  })

  it('never echoes an unmapped code', () => {
    // the redirect channel carries codes precisely so a crafted link
    // cannot place its own text in the error slot
    expect(formErrorCopy('<img src=x>')).toBe(
      'Something went wrong. Please try again.',
    )
  })

  it('returns nothing without a code', () => {
    expect(formErrorCopy(undefined)).toBeUndefined()
  })
})
