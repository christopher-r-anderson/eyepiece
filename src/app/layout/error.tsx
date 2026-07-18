import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { PrettyException } from '@/components/ui/error'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { useCaptureRouteError } from '@/app/layout/route-error'

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

  return (
    <div className={grid({ gap: '4' })}>
      <Heading level={headingLevel}>Something went wrong</Heading>

      <PrettyException
        error={error}
        headingLevel={headingLevel === 1 ? 2 : 3}
      />

      <Button
        variant="secondary"
        onPress={reset}
        css={css.raw({ justifySelf: 'start' })}
      >
        Try again
      </Button>
    </div>
  )
}
