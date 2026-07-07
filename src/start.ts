import { createStart } from '@tanstack/react-start'
import {
  sentryFunctionMiddleware,
  sentryRequestMiddleware,
} from '@/integrations/sentry/server'
import {
  createDevelopmentServerErrorLoggingMiddleware,
  createErrorResponseCacheSafetyMiddleware,
  createSessionReadTripwireMiddleware,
  createSetCookieSafetyNetMiddleware,
} from '@/integrations/tanstack-start/request-middleware'

const sessionReadTripwireMiddleware = createSessionReadTripwireMiddleware()
const developmentServerErrorLoggingMiddleware =
  createDevelopmentServerErrorLoggingMiddleware()
const errorResponseCacheSafetyMiddleware =
  createErrorResponseCacheSafetyMiddleware()
const setCookieSafetyNetMiddleware = createSetCookieSafetyNetMiddleware()

export const startInstance = createStart(() => {
  return {
    // Order is load-bearing and pinned by start.unit.test.ts:
    // - Sentry runs first; its user-context telemetry read happens outside
    //   the tripwire's tracked scope and must not trip the wire.
    // - The tripwire wraps everything else so all route work (loaders,
    //   handlers, inner middleware) runs inside its tracking scope.
    requestMiddleware: [
      sentryRequestMiddleware,
      sessionReadTripwireMiddleware,
      developmentServerErrorLoggingMiddleware,
      errorResponseCacheSafetyMiddleware,
      setCookieSafetyNetMiddleware,
    ],
    functionMiddleware: [sentryFunctionMiddleware],
  }
})
