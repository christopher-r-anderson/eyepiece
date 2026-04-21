import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as Sentry from '@sentry/tanstackstart-react'
import { getClientSentryConfig } from './config'
import { initClientSentry } from './client'
import type { AnyRouter } from '@tanstack/react-router'

vi.mock('@sentry/tanstackstart-react', () => ({
  init: vi.fn(),
  tanstackRouterBrowserTracingIntegration: vi
    .fn()
    .mockReturnValue('router-tracing'),
  replayIntegration: vi.fn().mockReturnValue('replay'),
}))

vi.mock('./config', () => ({
  getClientSentryConfig: vi.fn(),
}))

const mockSentryInit = vi.mocked(Sentry.init)
const mockTracingIntegration = vi.mocked(
  Sentry.tanstackRouterBrowserTracingIntegration,
)
const mockReplayIntegration = vi.mocked(Sentry.replayIntegration)
const mockGetClientSentryConfig = vi.mocked(getClientSentryConfig)

describe('initClientSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing for server-side routers', () => {
    initClientSentry({ isServer: true } as AnyRouter)

    expect(mockGetClientSentryConfig).not.toHaveBeenCalled()
    expect(mockSentryInit).not.toHaveBeenCalled()
  })

  it('does nothing when Sentry is disabled', () => {
    mockGetClientSentryConfig.mockReturnValue(null)

    initClientSentry({ isServer: false } as AnyRouter)

    expect(mockSentryInit).not.toHaveBeenCalled()
    expect(mockTracingIntegration).not.toHaveBeenCalled()
    expect(mockReplayIntegration).not.toHaveBeenCalled()
  })

  it('initializes Sentry with the normalized client config', () => {
    const router = { isServer: false } as AnyRouter

    mockGetClientSentryConfig.mockReturnValue({
      dsn: 'https://example@sentry.invalid/1',
      environment: 'development',
      release: 'abc123',
      tracesSampleRate: 0.25,
      replaysSessionSampleRate: 0.5,
      replaysOnErrorSampleRate: 1,
    })

    initClientSentry(router)

    expect(mockTracingIntegration).toHaveBeenCalledWith(router)
    expect(mockReplayIntegration).toHaveBeenCalled()
    expect(mockSentryInit).toHaveBeenCalledWith({
      dsn: 'https://example@sentry.invalid/1',
      environment: 'development',
      release: 'abc123',
      integrations: ['router-tracing', 'replay'],
      tracesSampleRate: 0.25,
      replaysSessionSampleRate: 0.5,
      replaysOnErrorSampleRate: 1,
    })
  })
})
