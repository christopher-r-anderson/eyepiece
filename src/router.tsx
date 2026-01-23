import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'

import { routeTree } from './routeTree.gen'
import { NotFoundPage } from './app/layout/not-found'
import type { AuthInteractionStrategy } from './features/auth/types'

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

  const router = createRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultNotFoundComponent: NotFoundPage,
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <TanstackQuery.Provider {...rqContext}>
          {props.children}
        </TanstackQuery.Provider>
      )
    },
    defaultViewTransition: true,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })

  return router
}
