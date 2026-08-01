import { css } from 'styled-system/css'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { ErrorFallback } from '@/components/errors/error-fallback'
import { pageMainCss } from '@/components/page-main'

// the root boundary replaces the whole app tree, shell included, so this
// wrapper owns the page <main>; the content lives in components/errors
export function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
  return (
    <main className={css(pageMainCss)}>
      <ErrorFallback error={error} reset={reset} headingLevel={1} />
    </main>
  )
}
