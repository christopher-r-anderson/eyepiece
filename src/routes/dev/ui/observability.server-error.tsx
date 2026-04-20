import { createFileRoute } from '@tanstack/react-router'
import { throwDevObservabilityServerError } from './-observability.helpers'
import { Link } from '@/components/ui/link'
import { PrettyException } from '@/components/ui/error'

export const Route = createFileRoute('/dev/ui/observability/server-error')({
  loader: () => {
    throwDevObservabilityServerError()
  },
  component: () => null,
  errorComponent: ({ error }) => (
    <div css={{ display: 'grid', gap: 'var(--space-4)' }}>
      <h2 css={{ margin: 0 }}>Server Error Scenario</h2>
      <p>
        This route intentionally throws during a full document request so the
        existing server-side Sentry middleware can capture it. It does not
        verify route-boundary tags.
      </p>
      <PrettyException error={error} headingLevel={2} />
      <Link to="/dev/ui/observability">Back to observability workbench</Link>
    </div>
  ),
})
