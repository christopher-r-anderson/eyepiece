import { createFileRoute } from '@tanstack/react-router'
import { DevBackLink } from '../-components'
import { createDevObservabilityValidationResponse } from './-helpers'
import { RouteError } from '@/app/layout/route-error'
import { Heading } from '@/components/ui/heading'

export const Route = createFileRoute('/dev/observability/handled-400')({
  loader: () => {
    throw createDevObservabilityValidationResponse()
  },
  component: () => null,
  errorComponent: ({ error }) => (
    <div css={{ display: 'grid', gap: 'var(--space-4)' }}>
      <RouteError
        error={error}
        heading={
          <Heading headingLevel={2} css={{ marginBlockEnd: 0 }}>
            Handled 400 Scenario
          </Heading>
        }
        message="This route intentionally returns a handled 400 response and should stay low-noise in Sentry."
        captureContext={{
          boundaryKind: 'route',
          feature: 'observability',
          operation: 'dev_handled_400',
        }}
      />
      <DevBackLink to="/dev/observability">
        Back to observability workbench
      </DevBackLink>
    </div>
  ),
})
