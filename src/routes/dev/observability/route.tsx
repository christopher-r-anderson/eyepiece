import { Outlet, createFileRoute } from '@tanstack/react-router'
import { DevBackLink, DevPageIntro, devPageSectionCss } from '../-components'

export const Route = createFileRoute('/dev/observability')({
  component: DevObservabilityLayout,
})

function DevObservabilityLayout() {
  return (
    <section css={devPageSectionCss}>
      <DevPageIntro
        title="Observability Workbench"
        description="Use these scenarios to verify the current Sentry and error-boundary behavior in development."
        backLink={<DevBackLink to="/dev">Back to dev landing</DevBackLink>}
      />

      <Outlet />
    </section>
  )
}
