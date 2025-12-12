import { useRef } from 'react'
import { useLandmark } from 'react-aria'
import type { ComponentPropsWithoutRef } from 'react'
import { Link } from '@/components/ui/link'
import ThemeToggleButton from '@/components/theme/theme-toggle-button'
import logo from '@/assets/eyepiece-logo.svg'

export function SiteNav({
  children,
  ...props
}: ComponentPropsWithoutRef<'nav'>) {
  const ref = useRef(null)
  const { landmarkProps } = useLandmark(
    { role: 'navigation', 'aria-label': 'Main site links and settings' },
    ref,
  )

  return (
    <nav
      {...props}
      {...landmarkProps}
      ref={ref}
      css={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gridTemplateAreas: '"logo links" "search search"',
        fontSize: '1.5rem',
        gap: '1rem',
        alignItems: 'center',
        padding: '1rem',
        '@media (min-width: 769px)': {
          gridTemplateColumns: 'auto 1fr auto',
          gridTemplateAreas: '"logo search links"',
        },
      }}
    >
      <Link
        to="/"
        css={{
          color: 'var(--text)',
          gridArea: 'logo',
        }}
        aria-label="eyepiece Home"
      >
        {/*
          `svg` `use` instead of `img` to allow CSS color control at the cost of no `alt` text
          still labeled for accessibility via `aria-label` but without a loading error fallback
        */}
        <svg
          width="200"
          height="48"
          role="image"
          aria-label="eyepiece logo"
          style={{
            maxWidth: '100%',
          }}
        >
          <use href={logo} />
        </svg>
      </Link>
      <div
        css={{
          gridArea: 'search',
          margin: 'auto',
        }}
      >
        {children}
      </div>
      <div
        css={{
          gridArea: 'links',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <ThemeToggleButton />
        <Link to="/collections">Collections</Link>
      </div>
    </nav>
  )
}
