import { createFileRoute } from '@tanstack/react-router'
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
    <section
      css={{
        display: 'grid',
        gap: 'var(--space-section-gap)',
      }}
    >
      <header css={{ display: 'grid', gap: 'var(--space-3)' }}>
        <div css={{ display: 'grid', gap: 'var(--space-2)' }}>
          <p
            css={{
              margin: 0,
              color: 'var(--text-accent)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Development Only
          </p>
          <h1
            css={{
              margin: 0,
              fontSize: 'var(--text-2xl)',
              lineHeight: 'var(--line-height-tight)',
            }}
          >
            Dev Workbenches
          </h1>
          <p css={{ margin: 0, maxWidth: 'var(--size-reading-max)' }}>
            Development mode only manual preview and test areas.
          </p>
        </div>
      </header>

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
              <h2 css={{ margin: 0, fontSize: 'var(--text-lg)' }}>
                {section.title}
              </h2>
              <p css={{ margin: 0 }}>{section.description}</p>
            </div>
            <Link to={section.to}>Open {section.title}</Link>
          </article>
        ))}
      </div>
    </section>
  )
}
