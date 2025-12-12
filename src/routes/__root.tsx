import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { App } from '@/app/shell'
import { ErrorBoundary } from '@/app/layout/error'

interface MyRouterContext {
  queryClient: QueryClient
  title?: () => string
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),

  component: RootComponent,
  errorComponent: ErrorBoundary,
})

function RootComponent() {
  return (
    <RootDocument>
      <App />
    </RootDocument>
  )
}

const SITE_TITLE = 'eyepiece: NASA Media Explorer'

function RootDocument({ children }: { children: React.ReactNode }) {
  const matches = useRouterState({ select: (s) => s.matches })
  const matchedTitle = [...matches].reverse().find((d) => d.context.title)
    ?.context.title

  const title = matchedTitle ? `${matchedTitle} | ${SITE_TITLE}` : SITE_TITLE
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <title>{title}</title>
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
