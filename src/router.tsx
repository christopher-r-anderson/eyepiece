import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'
import { initClientSentry } from './integrations/sentry/client'
import { routeTree } from './routeTree.gen'
import { NotFoundPage } from './app/layout/not-found'
import { getPublicSupabaseClientContext } from './integrations/supabase/providers/public-provider'
import { getUserSupabaseClientContext } from './integrations/supabase/providers/user-provider'
import { getOrigin } from './lib/utils'
import { getEyepieceClientContext } from './lib/eyepiece-api-client/eyepiece-client-provider'
import type { AuthInteractionStrategy } from '@/features/auth/auth.types'

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

  initClientSentry(router)

  return router
}
