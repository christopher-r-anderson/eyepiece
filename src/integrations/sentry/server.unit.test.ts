import { AsyncLocalStorage } from 'node:async_hooks'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as Sentry from '@sentry/tanstackstart-react'
import { getServerSentryConfig } from './config'
import {
  initServerSentry,
  runSentryRequestMiddleware,
  syncServerSentryUserContext,
} from './server'
import { AppException } from '@/lib/result'
import { operationalErrorObservability } from '@/lib/error-observability'
import { createUserSupabaseServerClient } from '@/integrations/supabase/user/server.server'
import { setSentryUserIdContext } from '@/features/auth/auth.sentry'

vi.mock('@tanstack/react-start', () => ({
  createMiddleware: () => {
    const builder = { server: (handler: unknown) => handler }

    return builder
  },
}))

const { mockSentryRequestHandler } = vi.hoisted(() => ({
  mockSentryRequestHandler: vi.fn(),
}))

vi.mock('@sentry/tanstackstart-react', () => ({
  init: vi.fn(),
  withIsolationScope: vi.fn((callback: (scope: unknown) => unknown) =>
    callback({}),
  ),
  sentryGlobalFunctionMiddleware: 'function-middleware',
  sentryGlobalRequestMiddleware: {
    options: {
      server: mockSentryRequestHandler,
    },
  },
}))

vi.mock('./config', () => ({
  getServerSentryConfig: vi.fn(),
}))

vi.mock('@/integrations/supabase/user/server.server', () => ({
  createUserSupabaseServerClient: vi.fn(),
}))

vi.mock('@/features/auth/auth.sentry', () => ({
  setSentryUserIdContext: vi.fn(),
}))

const mockSentryInit = vi.mocked(Sentry.init)
const mockWithIsolationScope = vi.mocked(Sentry.withIsolationScope)
const mockGetServerSentryConfig = vi.mocked(getServerSentryConfig)
const mockCreateUserSupabaseServerClient = vi.mocked(
  createUserSupabaseServerClient,
)
const mockSetSentryUserIdContext = vi.mocked(setSentryUserIdContext)
const requestIsolationStorage = new AsyncLocalStorage<{
  userId: string | null | undefined
}>()

function createDeferredPromise() {
  let resolvePromise!: () => void
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve
  })

  return {
    promise,
    resolve: resolvePromise,
  }
}

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

describe('syncServerSentryUserContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets the Sentry user id from verified auth claims', async () => {
    mockCreateUserSupabaseServerClient.mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: {
            claims: {
              sub: 'user-123',
            },
          },
          error: null,
        }),
      },
    } as never)

    await syncServerSentryUserContext()

    expect(mockSetSentryUserIdContext).toHaveBeenCalledWith('user-123')
  })

  it('clears the Sentry user when claims are unavailable', async () => {
    mockCreateUserSupabaseServerClient.mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'missing claims' },
        }),
      },
    } as never)

    await syncServerSentryUserContext()

    expect(mockSetSentryUserIdContext).toHaveBeenCalledWith(null)
  })

  it('clears the Sentry user when claim lookup throws', async () => {
    mockCreateUserSupabaseServerClient.mockImplementation(() => {
      throw new Error('boom')
    })

    await syncServerSentryUserContext()

    expect(mockSetSentryUserIdContext).toHaveBeenCalledWith(null)
  })
})

describe('sentryRequestMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockWithIsolationScope.mockImplementation(((
      callback: (scope: unknown) => unknown,
    ) => {
      return requestIsolationStorage.run({ userId: undefined }, () =>
        callback({}),
      )
    }) as typeof Sentry.withIsolationScope)

    mockSetSentryUserIdContext.mockImplementation((userId) => {
      const store = requestIsolationStorage.getStore()

      if (store) {
        store.userId = userId
      }
    })
  })

  it('runs request capture inside a fresh isolation scope', async () => {
    mockCreateUserSupabaseServerClient.mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: {
            claims: {
              sub: 'user-123',
            },
          },
          error: null,
        }),
      },
    } as never)

    const next = vi.fn().mockResolvedValue('ok')
    const order: Array<string> = []

    mockSetSentryUserIdContext.mockImplementation((userId) => {
      const store = requestIsolationStorage.getStore()

      if (store) {
        store.userId = userId
      }

      order.push(`user:${userId}`)
    })
    mockSentryRequestHandler.mockImplementation(async ({ next: runNext }) => {
      order.push('capture')
      const result = await runNext()
      order.push('next')
      return result
    })

    const result = await runSentryRequestMiddleware({
      next,
      context: undefined,
      pathname: '/test',
      request: new Request('https://example.com/test'),
    })

    expect(result).toBe('ok')
    expect(mockWithIsolationScope).toHaveBeenCalledOnce()
    expect(mockSentryRequestHandler).toHaveBeenCalledOnce()
    expect(order).toEqual(['user:user-123', 'capture', 'next'])
  })

  it('keeps overlapping authenticated requests attached to distinct users', async () => {
    const firstRequestRelease = createDeferredPromise()
    const secondRequestRelease = createDeferredPromise()
    const observedUserIds: Array<string | null | undefined> = []

    mockCreateUserSupabaseServerClient
      .mockReturnValueOnce({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: {
              claims: {
                sub: 'user-a',
              },
            },
            error: null,
          }),
        },
      } as never)
      .mockReturnValueOnce({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: {
              claims: {
                sub: 'user-b',
              },
            },
            error: null,
          }),
        },
      } as never)

    mockSentryRequestHandler
      .mockImplementationOnce(async ({ next }) => {
        await firstRequestRelease.promise
        observedUserIds.push(requestIsolationStorage.getStore()?.userId)
        return next()
      })
      .mockImplementationOnce(async ({ next }) => {
        await secondRequestRelease.promise
        observedUserIds.push(requestIsolationStorage.getStore()?.userId)
        return next()
      })

    const firstRequest = runSentryRequestMiddleware({
      next: vi.fn().mockResolvedValue('first-ok'),
      context: undefined,
      pathname: '/first',
      request: new Request('https://example.com/first'),
    })
    const secondRequest = runSentryRequestMiddleware({
      next: vi.fn().mockResolvedValue('second-ok'),
      context: undefined,
      pathname: '/second',
      request: new Request('https://example.com/second'),
    })

    secondRequestRelease.resolve()
    await expect(secondRequest).resolves.toBe('second-ok')

    firstRequestRelease.resolve()
    await expect(firstRequest).resolves.toBe('first-ok')

    expect(observedUserIds).toEqual(['user-b', 'user-a'])
  })
})
