import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import { PrettyException } from './pretty-exception'
import { useCaptureRouteError } from './error-capture'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'

// used in error path; use presentational components only
export function ErrorFallback({
  error,
  reset,
  headingLevel,
}: {
  error: unknown
  reset: () => void
  headingLevel: 1 | 2
}) {
  useCaptureRouteError(error, {
    boundaryKind: 'root-route',
    feature: 'app',
    operation: 'render_root_route',
  })

  return (
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
}
