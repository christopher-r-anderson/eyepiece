import { Outlet, createFileRoute } from '@tanstack/react-router'
import { DevBackLink, DevPageIntro, devPageSectionCss } from '../-components'
import { Link } from '@/components/ui/link'

export const Route = createFileRoute('/dev/ui')({
  component: DevUiLayout,
})

const navLinks = [
  { to: '/dev/ui', label: 'Overview', exact: true },
  { to: '/dev/ui/controls', label: 'Controls', exact: true },
  { to: '/dev/ui/feedback', label: 'Feedback', exact: true },
] as const

function DevUiLayout() {
  return (
    <section css={devPageSectionCss}>
      <header css={{ display: 'grid', gap: 'var(--space-3)' }}>
        <DevPageIntro
          title="UI Workbench"
          description="Shared components and interaction patterns."
          backLink={<DevBackLink to="/dev">Back to dev landing</DevBackLink>}
          descriptionTone="muted"
        />
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
    </section>
  )
}
