import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as Sentry from '@sentry/tanstackstart-react'
import { getServerSentryConfig } from './config'
import { initServerSentry } from './server'

vi.mock('@sentry/tanstackstart-react', () => ({
  init: vi.fn(),
  sentryGlobalFunctionMiddleware: 'function-middleware',
  sentryGlobalRequestMiddleware: 'request-middleware',
}))

vi.mock('./config', () => ({
  getServerSentryConfig: vi.fn(),
}))

const mockSentryInit = vi.mocked(Sentry.init)
const mockGetServerSentryConfig = vi.mocked(getServerSentryConfig)

describe('initServerSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when Sentry is disabled', () => {
    mockGetServerSentryConfig.mockReturnValue(null)

    initServerSentry()

    expect(mockSentryInit).not.toHaveBeenCalled()
  })

  it('initializes Sentry with the normalized server config', () => {
    mockGetServerSentryConfig.mockReturnValue({
      dsn: 'https://example@sentry.invalid/1',
      environment: 'production',
      release: 'abc123',
      tracesSampleRate: 0.25,
    })

    initServerSentry()

    expect(mockSentryInit).toHaveBeenCalledWith({
      dsn: 'https://example@sentry.invalid/1',
      environment: 'production',
      release: 'abc123',
      tracesSampleRate: 0.25,
    })
  })
})
