import { Outlet, createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { grid, wrap } from 'styled-system/patterns'
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
    <section className={css(devPageSectionCss)}>
      <header className={grid({ gap: '3' })}>
        <DevPageIntro
          title="UI Workbench"
          description="Shared components and interaction patterns."
          backLink={<DevBackLink to="/dev">Back to dev landing</DevBackLink>}
          descriptionTone="muted"
        />
        <nav
          aria-label="UI workbench sections"
          className={wrap({ align: 'center', gap: 'clusterGap' })}
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.exact }}
              activeProps={{
                className: 'is-active',
              }}
              css={css.raw({
                paddingBlock: '2',
                paddingInline: '3',
                border: 'default',
                borderRadius: 'md',
                textDecoration: 'none',
                '&.is-active': {
                  backgroundColor: 'secondary.bg',
                  color: 'secondary.text',
                },
              })}
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
