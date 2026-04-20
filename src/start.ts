import { createStart } from '@tanstack/react-start'
import {
  sentryFunctionMiddleware,
  sentryRequestMiddleware,
} from '@/integrations/sentry/server'
import { createDevelopmentServerErrorLoggingMiddleware } from '@/integrations/tanstack-start/request-middleware'

const developmentServerErrorLoggingMiddleware =
  createDevelopmentServerErrorLoggingMiddleware()

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [
      sentryRequestMiddleware,
      developmentServerErrorLoggingMiddleware,
    ],
    functionMiddleware: [sentryFunctionMiddleware],
  }
})
