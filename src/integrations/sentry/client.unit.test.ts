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
  replayIntegration: vi.fn(),
  addIntegration: vi.fn(),
}))

vi.mock('./config', () => ({
  getClientSentryConfig: vi.fn(),
}))

const mockSentryInit = vi.mocked(Sentry.init)
const mockTracingIntegration = vi.mocked(
  Sentry.tanstackRouterBrowserTracingIntegration,
)
const mockReplayIntegration = vi.mocked(Sentry.replayIntegration)
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
    expect(mockAddIntegration).not.toHaveBeenCalled()
  })

  it('initializes Sentry and attaches replay on first interaction', async () => {
    const router = { isServer: false } as AnyRouter
    mockGetClientSentryConfig.mockReturnValue(config)
    mockReplayIntegration.mockReturnValue('replay' as never)

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
    expect(mockAddIntegration).not.toHaveBeenCalled()

    window.dispatchEvent(new Event('pointerdown'))
    await vi.waitFor(() => {
      expect(mockAddIntegration).toHaveBeenCalledWith('replay')
    })

    // the other interaction listener was removed on the first fire
    window.dispatchEvent(new Event('keydown'))
    await vi.waitFor(() => {
      expect(mockAddIntegration).toHaveBeenCalledTimes(1)
    })
  })

  it('leaves Sentry running when replay fails to attach', async () => {
    mockGetClientSentryConfig.mockReturnValue(config)
    mockReplayIntegration.mockImplementation(() => {
      throw new Error('load failed')
    })

    initClientSentry({ isServer: false } as AnyRouter)

    expect(mockSentryInit).toHaveBeenCalled()
    window.dispatchEvent(new Event('keydown'))
    await vi.waitFor(() => {
      expect(mockReplayIntegration).toHaveBeenCalled()
    })
    expect(mockAddIntegration).not.toHaveBeenCalled()
  })
})
