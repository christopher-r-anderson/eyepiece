import {
  sentryGlobalFunctionMiddleware,
  sentryGlobalRequestMiddleware,
} from '@sentry/tanstackstart-react'
import { createStart } from '@tanstack/react-start'
import { createDevelopmentServerErrorLoggingMiddleware } from '@/integrations/tanstack-start/request-middleware'

const developmentServerErrorLoggingMiddleware =
  createDevelopmentServerErrorLoggingMiddleware()

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [
      developmentServerErrorLoggingMiddleware,
      sentryGlobalRequestMiddleware,
    ],
    functionMiddleware: [sentryGlobalFunctionMiddleware],
  }
})
