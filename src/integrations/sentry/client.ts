import * as Sentry from '@sentry/tanstackstart-react'
import { getClientSentryConfig } from './config'
import type { AnyRouter } from '@tanstack/react-router'

export function initClientSentry(router: AnyRouter) {
  if (router.isServer) {
    return
  }

  const config = getClientSentryConfig()

  if (!config) {
    return
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    integrations: [
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: config.tracesSampleRate,
    replaysSessionSampleRate: config.replaysSessionSampleRate,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
  })
}
