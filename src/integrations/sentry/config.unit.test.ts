import { describe, expect, it } from 'vitest'
import { getServerSentryConfig, parseSentrySampleRate } from './config'

describe('parseSentrySampleRate', () => {
  it('returns the fallback for undefined or blank values', () => {
    expect(parseSentrySampleRate(undefined, 0.1)).toBe(0.1)
    expect(parseSentrySampleRate('   ', 0.1)).toBe(0.1)
  })

  it('parses valid numeric values within the accepted range', () => {
    expect(parseSentrySampleRate('0', 0.1)).toBe(0)
    expect(parseSentrySampleRate('0.5', 0.1)).toBe(0.5)
    expect(parseSentrySampleRate('1', 0.1)).toBe(1)
  })

  it('returns the fallback for invalid values', () => {
    expect(parseSentrySampleRate('NaN', 0.1)).toBe(0.1)
    expect(parseSentrySampleRate('-1', 0.1)).toBe(0.1)
    expect(parseSentrySampleRate('2', 0.1)).toBe(0.1)
  })
})

describe('getServerSentryConfig', () => {
  it('returns null when Sentry is disabled', () => {
    expect(
      getServerSentryConfig({
        NODE_ENV: 'development',
        SENTRY_ENABLED: 'false',
        SENTRY_DSN: 'https://example@sentry.invalid/1',
      }),
    ).toBeNull()
  })

  it('returns the normalized server config when enabled', () => {
    expect(
      getServerSentryConfig({
        NODE_ENV: 'development',
        SENTRY_ENABLED: 'true',
        SENTRY_DSN: 'https://example@sentry.invalid/1',
        SENTRY_ENVIRONMENT: 'development',
        SENTRY_RELEASE: 'abc123',
        SENTRY_TRACES_SAMPLE_RATE: '0.25',
      }),
    ).toEqual({
      dsn: 'https://example@sentry.invalid/1',
      environment: 'development',
      release: 'abc123',
      tracesSampleRate: 0.25,
    })
  })
})
