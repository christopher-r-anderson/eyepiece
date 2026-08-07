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
  lazyLoadIntegration: vi.fn(),
  addIntegration: vi.fn(),
}))

vi.mock('./config', () => ({
  getClientSentryConfig: vi.fn(),
}))

const mockSentryInit = vi.mocked(Sentry.init)
const mockTracingIntegration = vi.mocked(
  Sentry.tanstackRouterBrowserTracingIntegration,
)
const mockLazyLoadIntegration = vi.mocked(Sentry.lazyLoadIntegration)
const mockAddIntegration = vi.mocked(Sentry.addIntegration)
const mockGetClientSentryConfig = vi.mocked(getClientSentryConfig)

const config = {
  dsn: 'https://example@sentry.invalid/1',
  environment: 'development',
  release: 'abc123',
  tracesSampleRate: 0.25,
  replaysSessionSampleRate: 0.5,
  replaysOnErrorSampleRate: 1,
}

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
    expect(mockLazyLoadIntegration).not.toHaveBeenCalled()
  })

  it('initializes Sentry and attaches replay once it lazy-loads', async () => {
    const router = { isServer: false } as AnyRouter
    const replayIntegration = vi.fn().mockReturnValue('replay')
    mockGetClientSentryConfig.mockReturnValue(config)
    mockLazyLoadIntegration.mockResolvedValue(replayIntegration as never)

    initClientSentry(router)

    expect(mockTracingIntegration).toHaveBeenCalledWith(router)
    expect(mockSentryInit).toHaveBeenCalledWith({
      dsn: 'https://example@sentry.invalid/1',
      environment: 'development',
      release: 'abc123',
      integrations: ['router-tracing'],
      tracesSampleRate: 0.25,
      replaysSessionSampleRate: 0.5,
      replaysOnErrorSampleRate: 1,
    })
    expect(mockLazyLoadIntegration).toHaveBeenCalledWith('replayIntegration')
    await vi.waitFor(() => {
      expect(mockAddIntegration).toHaveBeenCalledWith('replay')
    })
  })

  it('leaves Sentry running when the replay bundle fails to load', async () => {
    mockGetClientSentryConfig.mockReturnValue(config)
    mockLazyLoadIntegration.mockRejectedValue(new Error('cdn unreachable'))

    initClientSentry({ isServer: false } as AnyRouter)

    expect(mockSentryInit).toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(mockLazyLoadIntegration).toHaveBeenCalled()
    })
    expect(mockAddIntegration).not.toHaveBeenCalled()
  })
})
