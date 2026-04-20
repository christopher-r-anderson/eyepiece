import {
  sentryGlobalFunctionMiddleware,
  sentryGlobalRequestMiddleware,
} from '@sentry/tanstackstart-react'
import * as Sentry from '@sentry/tanstackstart-react'
import { getServerSentryConfig } from './config'

export const sentryRequestMiddleware = sentryGlobalRequestMiddleware
export const sentryFunctionMiddleware = sentryGlobalFunctionMiddleware

export function initServerSentry() {
  const config = getServerSentryConfig()

  if (!config) {
    return
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    tracesSampleRate: config.tracesSampleRate,
  })
}
