import { createFileRoute } from '@tanstack/react-router'
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
  {
    title: 'Observability',
    description: 'Trigger deterministic client and server error scenarios.',
    to: '/dev/ui/observability',
  },
] as const

function DevUiOverviewPage() {
  return (
    <section
      css={{
        display: 'grid',
        gap: 'var(--space-section-gap)',
      }}
    >
      <div css={{ display: 'grid', gap: 'var(--space-2)' }}>
        <h2 css={{ margin: 0, fontSize: 'var(--text-xl)' }}>Start Here</h2>
        <p css={{ margin: 0, maxWidth: 'var(--size-reading-max)' }}>
          Shared UI sections and verification tools.
        </p>
      </div>

      <div
        css={{
          display: 'grid',
          alignItems: 'start',
          gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {sections.map((section) => (
          <article
            key={section.to}
            css={{
              display: 'grid',
              gap: 'var(--space-3)',
              padding: 'var(--space-5)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--secondary-bg)',
              color: 'var(--secondary-text)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div css={{ display: 'grid', gap: 'var(--space-2)' }}>
              <h3 css={{ margin: 0, fontSize: 'var(--text-lg)' }}>
                {section.title}
              </h3>
              <p css={{ margin: 0 }}>{section.description}</p>
            </div>
            <Link to={section.to}>Open {section.title}</Link>
          </article>
        ))}
      </div>
    </section>
  )
}
