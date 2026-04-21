import { createFileRoute } from '@tanstack/react-router'
import {
  DevLinkCard,
  DevPageIntro,
  devCardGridCss,
  devPageSectionCss,
} from './-components'
import { Link } from '@/components/ui/link'

export const Route = createFileRoute('/dev/')({
  component: DevOverviewPage,
})

const sections = [
  {
    title: 'UI Workbench',
    description: 'Preview shared components, controls, and feedback patterns.',
    to: '/dev/ui',
  },
  {
    title: 'Observability Workbench',
    description:
      'Run deterministic client and server error verification scenarios.',
    to: '/dev/observability',
  },
] as const

function DevOverviewPage() {
  return (
    <section css={devPageSectionCss}>
      <DevPageIntro
        title="Dev Workbenches"
        description="Development mode only manual preview and test areas."
      />

      <div css={devCardGridCss}>
        {sections.map((section) => (
          <DevLinkCard
            key={section.to}
            title={section.title}
            description={section.description}
            action={<Link to={section.to}>Open {section.title}</Link>}
          />
        ))}
      </div>
    </section>
  )
}
