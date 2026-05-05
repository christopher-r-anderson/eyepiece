import { createStart } from '@tanstack/react-start'
import {
  sentryFunctionMiddleware,
  sentryRequestMiddleware,
} from '@/integrations/sentry/server'
import {
  createDevelopmentServerErrorLoggingMiddleware,
  createSetCookieSafetyNetMiddleware,
} from '@/integrations/tanstack-start/request-middleware'

const developmentServerErrorLoggingMiddleware =
  createDevelopmentServerErrorLoggingMiddleware()
const setCookieSafetyNetMiddleware = createSetCookieSafetyNetMiddleware()

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [
      sentryRequestMiddleware,
      developmentServerErrorLoggingMiddleware,
      setCookieSafetyNetMiddleware,
    ],
    functionMiddleware: [sentryFunctionMiddleware],
  }
})
