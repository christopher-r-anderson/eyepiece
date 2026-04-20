import {
  sentryGlobalFunctionMiddleware,
  sentryGlobalRequestMiddleware,
} from '@sentry/tanstackstart-react'
import * as Sentry from '@sentry/tanstackstart-react'
import { getServerSentryConfig } from './config'
import { getErrorSentryMetadata } from '@/lib/error-observability'

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
    beforeSend(event, hint) {
      const metadata = getErrorSentryMetadata(hint.originalException)

      if (!metadata) {
        return event
      }

      return {
        ...event,
        tags: {
          ...event.tags,
          ...metadata.tags,
        },
        contexts: metadata.context
          ? {
              ...event.contexts,
              error_observability: {
                ...(event.contexts?.error_observability ?? {}),
                ...metadata.context,
              },
            }
          : event.contexts,
      }
    },
  })
}
