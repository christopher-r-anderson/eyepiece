import { createFileRoute } from '@tanstack/react-router'
import { createDevObservabilityValidationResponse } from './-observability.helpers'
import { RouteError } from '@/app/layout/route-error'
import { Link } from '@/components/ui/link'

export const Route = createFileRoute('/dev/ui/observability/handled-400')({
  loader: () => {
    throw createDevObservabilityValidationResponse()
  },
  component: () => null,
  errorComponent: ({ error }) => (
    <div css={{ display: 'grid', gap: 'var(--space-4)' }}>
      <RouteError
        error={error}
        heading={<h2 css={{ margin: 0 }}>Handled 400 Scenario</h2>}
        message="This route intentionally returns a handled 400 response and should stay low-noise in Sentry."
        captureContext={{
          boundaryKind: 'route',
          feature: 'observability',
          operation: 'dev_handled_400',
        }}
      />
      <Link to="/dev/ui/observability">Back to observability workbench</Link>
    </div>
  ),
})
