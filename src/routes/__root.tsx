import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import pandaCss from '../panda.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import { App } from '@/app/shell'
import { RouteErrorBoundary } from '@/app/layout/error'
import { getTitleText } from '@/lib/utils'
import { SITE_DESCRIPTION, socialMeta } from '@/lib/social-meta'

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
      { property: 'og:site_name', content: 'eyepiece' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      ...socialMeta({
        title: getTitleText(undefined),
        description: SITE_DESCRIPTION,
        image: { url: '/og.jpg', width: 1200, height: 630 },
      }),
    ],
    links: [
      // the first-paint faces: body text, and the display face whose late
      // swap rewraps headings at narrow widths (a one-line-height layout
      // shift); remaining weights load on demand
      {
        rel: 'preload',
        href: '/fonts/switzer-400.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        href: '/fonts/zodiak-400.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      { rel: 'stylesheet', href: pandaCss },
      // sizes on the ico steers svg-capable browsers to icon.svg
      { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
      { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
  }),

  component: RootComponent,
  errorComponent: RouteErrorBoundary,
})

function RootComponent() {
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
