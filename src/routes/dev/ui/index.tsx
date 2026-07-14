import { createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import {
  DevLinkCard,
  DevTitleBlock,
  devCardGridCss,
  devPageSectionCss,
} from '../-components'
import { Link } from '@/components/ui/link'

export const Route = createFileRoute('/dev/ui/')({
  component: DevUiOverviewPage,
})

const sections = [
  {
    title: 'Controls',
    description: 'Buttons, tabs, and form fields.',
    to: '/dev/ui/controls',
  },
  {
    title: 'Feedback',
    description: 'Toast and modal patterns.',
    to: '/dev/ui/feedback',
  },
] as const

function DevUiOverviewPage() {
  return (
    <section className={css(devPageSectionCss)}>
      <DevTitleBlock title="Start Here" description="Shared UI sections." />

      <div className={css(devCardGridCss)}>
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
