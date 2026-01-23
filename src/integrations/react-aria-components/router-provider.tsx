import { RouterProvider as RacRouterProvider } from 'react-aria-components'
import { useRouter } from '@tanstack/react-router'
import type { NavigateOptions, ToOptions } from '@tanstack/react-router'
import type { ReactNode } from 'react'

// based on tanstack router tab within vite tab on https://react-aria.adobe.com/frameworks
// but with changes to support strings passed as `href`s instead of `ToOptions`
// needed because typescript can't flag improper usage at the source
// See details/reasons at (and in progress workarounds linked from): https://github.com/adobe/react-spectrum/discussions/9450
declare module 'react-aria-components' {
  interface RouterConfig {
    href: ToOptions
    routerOptions: Omit<NavigateOptions, keyof ToOptions>
  }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <RacRouterProvider
      navigate={(href, opts) => {
        const target = href as ToOptions | string
        if (typeof target === 'string') {
          return router.navigate({ to: target, ...opts })
        }
        return router.navigate({ ...target, ...opts })
      }}
      useHref={(href) => {
        const target = href as ToOptions | string
        if (typeof target === 'string') {
          return router.buildLocation({ to: target }).href
        }
        return router.buildLocation(target).href
      }}
    >
      {children}
    </RacRouterProvider>
  )
}
