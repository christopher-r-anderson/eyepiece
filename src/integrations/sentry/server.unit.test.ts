import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as Sentry from '@sentry/tanstackstart-react'
import { getServerSentryConfig } from './config'
import { initServerSentry } from './server'
import { AppException } from '@/lib/result'
import { operationalErrorObservability } from '@/lib/error-observability'

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

    expect(mockSentryInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://example@sentry.invalid/1',
        environment: 'production',
        release: 'abc123',
        tracesSampleRate: 0.25,
        beforeSend: expect.any(Function),
      }),
    )

    const beforeSend = mockSentryInit.mock.calls[0]?.[0].beforeSend
    const event = beforeSend?.(
      {
        tags: { existing: 'tag' },
        contexts: {
          error_observability: {
            requestId: 'req-123',
          },
        },
      } as unknown as Parameters<NonNullable<typeof beforeSend>>[0],
      {
        originalException: new AppException({
          code: 'PROVIDER_REQUEST_FAILED',
          message: 'Provider request failed',
          observability: operationalErrorObservability({
            tags: {
              feature: 'providers',
              operation: 'asset.fetch',
            },
            context: {
              page: 2,
            },
          }),
        }),
      },
    )

    expect(event).toEqual({
      tags: {
        existing: 'tag',
        feature: 'providers',
        operation: 'asset.fetch',
      },
      contexts: {
        error_observability: {
          requestId: 'req-123',
          page: 2,
        },
      },
    })
  })
})
