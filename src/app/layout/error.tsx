import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { PrettyException } from '@/components/errors/pretty-exception'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { pageMainCss } from '@/components/page-main'
import { useCaptureRouteError } from '@/components/errors/error-capture'

// the root boundary sticks to presentational ui components - nothing that
// depends on app providers, which could rethrow inside a broken tree
export function RouteErrorBoundary({
  error,
  reset,
  headingLevel = 1,
}: ErrorComponentProps & { headingLevel?: 1 | 2 }) {
  useCaptureRouteError(error, {
    boundaryKind: 'root-route',
    feature: 'app',
    operation: 'render_root_route',
  })

  const body = (
    <div className={grid({ gap: '4', justifyItems: 'start' })}>
      <Heading
        level={headingLevel}
        css={css.raw(
          headingLevel === 1
            ? { textStyle: 'display.md' }
            : { textStyle: 'title.md' },
        )}
      >
        Something went wrong
      </Heading>

      <PrettyException
        error={error}
        headingLevel={headingLevel === 1 ? 2 : 3}
      />

      <Button variant="secondary" onPress={reset}>
        Try again
      </Button>
    </div>
  )

  // at level 1 the boundary replaces the whole app tree, shell included, so
  // it brings its own <main> geometry
  if (headingLevel === 1) {
    return <main className={css(pageMainCss)}>{body}</main>
  }

  return body
}
