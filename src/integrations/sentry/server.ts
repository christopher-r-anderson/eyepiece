import { createMiddleware } from '@tanstack/react-start'
import {
  sentryGlobalFunctionMiddleware,
  sentryGlobalRequestMiddleware,
} from '@sentry/tanstackstart-react'
import * as Sentry from '@sentry/tanstackstart-react'
import { getServerSentryConfig } from './config'
import type {
  RequestMiddlewareServerFnResult,
  RequestServerFn,
  RequestServerOptions,
} from '@tanstack/react-start'
import { setSentryUserIdContext } from '@/features/auth/auth.sentry'
import { createUserSupabaseServerClient } from '@/integrations/supabase/user/server.server'
import { getErrorSentryMetadata } from '@/lib/error-observability'

function getSentryUserIdFromClaims(claims: unknown): string | null {
  if (!claims || typeof claims !== 'object') {
    return null
  }

  const subject = Reflect.get(claims, 'sub')

  return typeof subject === 'string' ? subject : null
}

export async function syncServerSentryUserContext() {
  try {
    const { data, error } =
      await createUserSupabaseServerClient().auth.getClaims()

    if (error) {
      setSentryUserIdContext(null)
      return
    }

    setSentryUserIdContext(getSentryUserIdFromClaims(data?.claims))
  } catch {
    // Observability enrichment must not break request handling.
    setSentryUserIdContext(null)
  }
}

type SentryRequestContext = RequestServerOptions<{}, unknown>
type SentryRequestResult = RequestMiddlewareServerFnResult<
  {},
  unknown,
  undefined
>

const sentryGlobalRequestHandler = sentryGlobalRequestMiddleware.options
  .server as RequestServerFn<{}, unknown, undefined> | undefined

export function runSentryRequestMiddleware(
  context: SentryRequestContext,
): SentryRequestResult {
  return Sentry.withIsolationScope(async () => {
    // The Sentry user must be set inside the request isolation scope so it
    // cannot leak across overlapping requests.
    await syncServerSentryUserContext()

    if (sentryGlobalRequestHandler) {
      return sentryGlobalRequestHandler(context)
    }

    return context.next()
  })
}

export const sentryRequestMiddleware = createMiddleware().server(
  runSentryRequestMiddleware,
)

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
