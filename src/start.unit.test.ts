import { describe, expect, it, vi } from 'vitest'

import { startInstance } from './start'

vi.mock('@tanstack/react-start', () => ({
  createStart: vi.fn((factory: () => unknown) => factory()),
}))

vi.mock('@/integrations/sentry/server', () => ({
  sentryFunctionMiddleware: 'sentry-function-middleware',
  sentryRequestMiddleware: 'sentry-request-middleware',
}))

vi.mock('@/integrations/tanstack-start/request-middleware', () => ({
  createDevelopmentServerErrorLoggingMiddleware: vi.fn(
    () => 'development-logging-middleware',
  ),
  createErrorResponseCacheSafetyMiddleware: vi.fn(
    () => 'error-response-cache-safety-middleware',
  ),
  createSessionReadTripwireMiddleware: vi.fn(
    () => 'session-read-tripwire-middleware',
  ),
  createSetCookieSafetyNetMiddleware: vi.fn(
    () => 'set-cookie-safety-net-middleware',
  ),
}))

describe('startInstance', () => {
  // The order is a policy invariant, not an implementation detail:
  // Sentry's telemetry session read must stay outside the tripwire's tracked
  // scope, and the tripwire must wrap all route work. See start.ts.
  it('registers request middleware in the expected order', () => {
    expect(startInstance).toEqual({
      requestMiddleware: [
        'sentry-request-middleware',
        'session-read-tripwire-middleware',
        'development-logging-middleware',
        'error-response-cache-safety-middleware',
        'set-cookie-safety-net-middleware',
      ],
      functionMiddleware: ['sentry-function-middleware'],
    })
  })
})
