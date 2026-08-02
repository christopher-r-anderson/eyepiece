import { createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
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
    title: 'UI gallery',
    description: 'Shared components and their variants.',
    to: '/dev/ui',
    label: 'Open the gallery',
  },
  {
    title: 'Observability',
    description:
      'Repeatable error scenarios for checking Sentry and boundary behavior.',
    to: '/dev/observability',
    label: 'Open observability',
  },
] as const

function DevOverviewPage() {
  return (
    <section className={css(devPageSectionCss)}>
      <DevPageIntro
        title="Dev pages"
        description="Manual preview and verification areas. These routes 404 outside development."
      />

      <div className={css(devCardGridCss)}>
        {sections.map((section) => (
          <DevLinkCard
            key={section.to}
            title={section.title}
            description={section.description}
            action={<Link to={section.to}>{section.label}</Link>}
          />
        ))}
      </div>
    </section>
  )
}
