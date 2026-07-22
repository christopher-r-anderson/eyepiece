import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { useEffect } from 'react'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import pandaCss from '../panda.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import { App } from '@/app/shell'
import { RouteErrorBoundary } from '@/app/layout/error'
import { getTitleText } from '@/lib/utils'
import { installStartViewTransitionDelayFix } from '@/lib/view-transition-pop-fix'

// The user-scoped Supabase client is deliberately absent: it is accessed via
// the isomorphic createUserSupabaseClient() factory, never router context, so
// public-subtree SSR cannot receive user capability by tree position.
interface MyRouterContext {
  eyepieceClient: EyepieceClient
  queryClient: QueryClient
  publicSupabaseClient: SupabaseClient
  title?: () => string
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: getTitleText(undefined) },
    ],
    links: [
      // the body face is needed at first paint; other faces load on demand
      // (preload zodiak-400 here once display type ships on real surfaces)
      {
        rel: 'preload',
        href: '/fonts/switzer-400.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      { rel: 'stylesheet', href: pandaCss },
    ],
  }),

  component: RootComponent,
  errorComponent: RouteErrorBoundary,
})

function RootComponent() {
  useEffect(() => {
    installStartViewTransitionDelayFix()
  }, [])
  return (
    <RootDocument>
      <App />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
