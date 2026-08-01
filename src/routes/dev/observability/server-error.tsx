import { createFileRoute } from '@tanstack/react-router'
import { grid } from 'styled-system/patterns'
import { DevBackLink } from '../-components'
import { throwDevObservabilityServerError } from './-helpers'
import { PrettyException } from '@/components/errors/pretty-exception'
import { Heading } from '@/components/ui/heading'

export const Route = createFileRoute('/dev/observability/server-error')({
  loader: () => {
    throwDevObservabilityServerError()
  },
  component: () => null,
  errorComponent: ({ error }) => (
    <div className={grid({ gap: '4' })}>
      <Heading level={2}>Server Error Scenario</Heading>
      <p>
        This route intentionally throws during a full document request so the
        existing server-side Sentry middleware can capture it. The page keeps
        the UI summary stable and does not render raw stack traces. It does not
        verify route-boundary tags.
      </p>
      <PrettyException error={error} headingLevel={2} />
      <DevBackLink to="/dev/observability">
        Back to observability workbench
      </DevBackLink>
    </div>
  ),
})
