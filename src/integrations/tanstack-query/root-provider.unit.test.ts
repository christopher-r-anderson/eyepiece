import { describe, expect, it } from 'vitest'
import { shouldRetryQuery } from './root-provider'
import { EyepieceApiError } from '@/lib/eyepiece-api-client/client'

describe('shouldRetryQuery', () => {
  it('never retries a 4xx api error', () => {
    for (const status of [400, 403, 404, 408]) {
      const error = new EyepieceApiError('nope', status, undefined)
      expect(shouldRetryQuery(0, error)).toBe(false)
    }
  })

  it('retries a 429 up to three times', () => {
    const error = new EyepieceApiError('rate limited', 429, undefined)
    expect(shouldRetryQuery(0, error)).toBe(true)
    expect(shouldRetryQuery(3, error)).toBe(false)
  })

  it('retries a 5xx api error up to three times', () => {
    const error = new EyepieceApiError('upstream down', 502, undefined)
    expect(shouldRetryQuery(0, error)).toBe(true)
    expect(shouldRetryQuery(2, error)).toBe(true)
    expect(shouldRetryQuery(3, error)).toBe(false)
  })

  it('retries errors that carry no status up to three times', () => {
    const error = new Error('network hiccup')
    expect(shouldRetryQuery(0, error)).toBe(true)
    expect(shouldRetryQuery(3, error)).toBe(false)
  })
})
