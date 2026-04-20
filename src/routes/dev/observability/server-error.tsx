import { createFileRoute } from '@tanstack/react-router'
import { throwDevObservabilityServerError } from './-helpers'
import { PrettyException } from '@/components/ui/error'
import { Link } from '@/components/ui/link'

export const Route = createFileRoute('/dev/observability/server-error')({
  loader: () => {
    throwDevObservabilityServerError()
  },
  component: () => null,
  errorComponent: ({ error }) => (
    <div css={{ display: 'grid', gap: 'var(--space-4)' }}>
      <h1 css={{ margin: 0 }}>Server Error Scenario</h1>
      <p>
        This route intentionally throws during a full document request so the
        existing server-side Sentry middleware can capture it. The page keeps
        the UI summary stable and does not render raw stack traces. It does not
        verify route-boundary tags.
      </p>
      <PrettyException error={error} headingLevel={2} />
      <Link to="/dev/observability">Back to observability workbench</Link>
    </div>
  ),
})
