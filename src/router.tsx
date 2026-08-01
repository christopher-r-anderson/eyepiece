import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'
import { initClientSentry } from './integrations/sentry/client'
import { routeTree } from './routeTree.gen'
import { NotFoundPage } from './app/layout/not-found'
import { getPublicSupabaseClientContext } from './integrations/supabase/providers/public-provider'
import { getOrigin } from './lib/utils'
import { getEyepieceClientContext } from './lib/eyepiece-api-client/eyepiece-client-provider'
import {
  parseSearchParams,
  stringifyCanonicalSearchParams,
} from './lib/search-params'
import type { AuthInteractionStrategy } from '@/features/auth/auth.types'
import type { AssetKey } from '@/domain/asset/asset.schema'

declare module '@tanstack/react-router' {
  interface HistoryState {
    returnUrl?: string
    // marks an entry a dialog pushed to open itself; close() consumes it
    // with back(), while deep-linked opens (no flag) close by replace
    dialogPushed?: boolean
    // the asset shown as an overlay above the list the entry belongs to;
    // the entry's displayed URL is masked to the asset detail route
    viewingAsset?: AssetKey
    // the auth dialog above the entry's page; forgot-password is a login
    // sub-state
    authModal?: 'login' | 'register'
    authForgotPassword?: boolean
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
  const router = createRouter({
    routeTree,
    context: {
      ...rqContext,
      ...eyepieceClientContext,
      ...publicSupabaseContext,
    },
    defaultPreload: 'intent',
    parseSearch: parseSearchParams,
    stringifySearch: stringifyCanonicalSearchParams,
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultNotFoundComponent: NotFoundPage,
    // every undeclared URL miss renders the site-level 404 at the root;
    // routes that want an in-context body declare their own
    // notFoundComponent
    notFoundMode: 'root',
  })

  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })

  initClientSentry(router)

  return router
}
