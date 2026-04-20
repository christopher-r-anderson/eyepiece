import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'
import { Link } from '@/components/ui/link'

export const Route = createFileRoute('/dev/ui')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw notFound()
    }
  },
  component: DevUiLayout,
})

const navLinks = [
  { to: '/dev/ui', label: 'Overview', exact: true },
  { to: '/dev/ui/controls', label: 'Controls', exact: true },
  { to: '/dev/ui/feedback', label: 'Feedback', exact: true },
  { to: '/dev/ui/observability', label: 'Observability', exact: false },
] as const

function DevUiLayout() {
  return (
    <div
      css={{
        width: '100%',
        flex: 1,
        maxWidth: 'var(--size-content-max)',
        margin: '0 auto',
        paddingInline: 'var(--space-content-inline)',
        paddingBlock: 'var(--space-content-block)',
        display: 'grid',
        alignContent: 'start',
        gap: 'var(--space-section-gap)',
      }}
    >
      <header
        css={{
          display: 'grid',
          gap: 'var(--space-3)',
        }}
      >
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
            UI Workbench
          </h1>
          <p
            css={{
              margin: 0,
              maxWidth: 'var(--size-reading-max)',
              color: 'var(--text-muted)',
            }}
          >
            Shared components, interaction patterns, and observability checks.
          </p>
        </div>
        <nav
          aria-label="UI workbench sections"
          css={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-cluster-gap)',
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.exact }}
              activeProps={{
                className: 'is-active',
              }}
              css={{
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                '&.is-active': {
                  backgroundColor: 'var(--secondary-bg)',
                  color: 'var(--secondary-text)',
                },
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <Outlet />
    </div>
  )
}
