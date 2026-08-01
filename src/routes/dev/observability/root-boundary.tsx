import { createFileRoute } from '@tanstack/react-router'
import { grid } from 'styled-system/patterns'
import { DevBackLink, DevTitleBlock } from '../-components'
import { ErrorFallback } from '@/components/errors/error-fallback'

const scenarioError = new Error('Dev observability: root boundary failure', {
  cause: new Error('Dev observability: nested cause', {
    cause: 'a string cause at the end of the chain',
  }),
})

export const Route = createFileRoute('/dev/observability/root-boundary')({
  component: () => (
    <div className={grid({ gap: '4' })}>
      <DevTitleBlock
        title="Root Boundary Scenario"
        description="Renders the root route error boundary directly with a synthetic error. Try again is a no-op here."
      />
      <ErrorFallback error={scenarioError} reset={() => {}} headingLevel={2} />
      <DevBackLink to="/dev/observability">
        Back to observability workbench
      </DevBackLink>
    </div>
  ),
})
