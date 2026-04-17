import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as Sentry from '@sentry/tanstackstart-react'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'
import { routeTree } from './routeTree.gen'
import { NotFoundPage } from './app/layout/not-found'
import { getPublicSupabaseClientContext } from './integrations/supabase/providers/public-provider'
import { getUserSupabaseClientContext } from './integrations/supabase/providers/user-provider'
import { getOrigin } from './lib/utils'
import { getEyepieceClientContext } from './lib/eyepiece-api-client/eyepiece-client-provider'
import type { AuthInteractionStrategy } from '@/features/auth/auth.types'

function parseSampleRate(value: string | undefined, fallback: number) {
  if (value === undefined) {
    return fallback
  }

  const normalizedValue = value.trim()

  if (normalizedValue === '') {
    return fallback
  }

  const parsed = Number(normalizedValue)

  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : fallback
}

declare module '@tanstack/react-router' {
  interface HistoryState {
    returnUrl?: string
  }
  interface StaticDataRouteOption {
    authInteractionStrategy?: AuthInteractionStrategy
  }
}

export const getRouter = () => {
  const rqContext = TanstackQuery.getContext()
  const eyepieceClientContext = getEyepieceClientContext({
    origin: getOrigin(),
  })
  const publicSupabaseContext = getPublicSupabaseClientContext()
  const userSupabaseContext = getUserSupabaseClientContext()
  const router = createRouter({
    routeTree,
    context: {
      ...rqContext,
      ...eyepieceClientContext,
      ...publicSupabaseContext,
      ...userSupabaseContext,
    },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultNotFoundComponent: NotFoundPage,
    defaultViewTransition: true,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN
  const sentryEnabled =
    import.meta.env.MODE !== 'test' &&
    import.meta.env.VITE_SENTRY_ENABLED === 'true' &&
    Boolean(sentryDsn)

  if (!router.isServer && sentryEnabled) {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || undefined,
      release: import.meta.env.VITE_SENTRY_RELEASE || undefined,

      integrations: [
        Sentry.tanstackRouterBrowserTracingIntegration(router),
        Sentry.replayIntegration(),
      ],

      tracesSampleRate: parseSampleRate(
        import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
        0.1,
      ),

      // Capture Replay for 10% of all sessions,
      // plus for 100% of sessions with an error.
      replaysSessionSampleRate: parseSampleRate(
        import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
        0.1,
      ),
      replaysOnErrorSampleRate: parseSampleRate(
        import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
        1.0,
      ),
    })
  }

  return router
}
