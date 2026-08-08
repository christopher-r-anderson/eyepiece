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
  // loading on first input keeps the replay chunk out of passive visits;
  // a crash before any interaction gets error events but no replay
  const interactionEvents = ['pointerdown', 'keydown'] as const
  const loadReplay = () => {
    for (const event of interactionEvents) {
      removeEventListener(event, loadReplay)
    }
    void import('@sentry/tanstackstart-react')
      .then((lazy) => {
        Sentry.addIntegration(lazy.replayIntegration())
      })
      .catch(() => {
        // telemetry stays best-effort when the chunk fails to load
      })
  }
  for (const event of interactionEvents) {
    addEventListener(event, loadReplay, { once: true, passive: true })
  }
}
