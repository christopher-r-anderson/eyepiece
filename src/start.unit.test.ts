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
}))

describe('startInstance', () => {
  it('registers the Sentry request middleware before development logging', () => {
    expect(startInstance).toEqual({
      requestMiddleware: [
        'sentry-request-middleware',
        'development-logging-middleware',
      ],
      functionMiddleware: ['sentry-function-middleware'],
    })
  })
})
