import { createFileRoute } from '@tanstack/react-router'
import { DevBackLink } from '../-components'
import { throwDevObservabilityServerError } from './-helpers'
import { PrettyException } from '@/components/ui/error'
import { Heading } from '@/components/ui/heading'

export const Route = createFileRoute('/dev/observability/server-error')({
  loader: () => {
    throwDevObservabilityServerError()
  },
  component: () => null,
  errorComponent: ({ error }) => (
    <div css={{ display: 'grid', gap: 'var(--space-4)' }}>
      <Heading headingLevel={2} css={{ marginBlockEnd: 0 }}>
        Server Error Scenario
      </Heading>
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
