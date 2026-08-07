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
    integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
    tracesSampleRate: config.tracesSampleRate,
    replaysSessionSampleRate: config.replaysSessionSampleRate,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
  })
  // referencing replayIntegration statically bundles ~300KiB into the entry
  // chunk; lazy-loading fetches it from Sentry's CDN after startup, at the
  // cost of not recording a session's first moments
  void Sentry.lazyLoadIntegration('replayIntegration')
    .then((replayIntegration) => {
      Sentry.addIntegration(replayIntegration())
    })
    .catch(() => {
      // telemetry stays best-effort when the CDN is unreachable
    })
}
