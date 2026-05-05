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
  createSetCookieSafetyNetMiddleware: vi.fn(
    () => 'set-cookie-safety-net-middleware',
  ),
}))

describe('startInstance', () => {
  it('registers request middleware in the expected order', () => {
    expect(startInstance).toEqual({
      requestMiddleware: [
        'sentry-request-middleware',
        'development-logging-middleware',
        'set-cookie-safety-net-middleware',
      ],
      functionMiddleware: ['sentry-function-middleware'],
    })
  })
})
