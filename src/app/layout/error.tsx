import { css } from 'styled-system/css'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { ErrorFallback } from '@/components/errors/error-fallback'
import { MAIN_CONTENT_ID, pageMainCss } from '@/components/page-main'

export function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className={css(pageMainCss)}>
      <ErrorFallback error={error} reset={reset} headingLevel={1} />
    </main>
  )
}
