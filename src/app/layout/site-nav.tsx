import { useRef } from 'react'
import { useLandmark } from 'react-aria'
import type { ComponentPropsWithoutRef } from 'react'
import { Link } from '@/components/ui/link'
import ThemeToggleButton from '@/components/theme/theme-toggle-button'
import logo from '@/assets/eyepiece-logo.svg'
import { UserStatus } from '@/features/auth/components/user-status'
import {
  COMPACT_LAYOUT_MIN_WIDTH,
  HEADER_INLINE_MIN_WIDTH,
} from '@/lib/breakpoints'

export function SiteNav(props: ComponentPropsWithoutRef<'nav'>) {
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
        containerType: 'inline-size',
      }}
    >
      <div
        css={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gridTemplateAreas: '"logo" "links"',
          gap: 'var(--space-2)',
          justifyItems: 'center',
          alignItems: 'center',
          padding: 'var(--space-3) var(--space-4)',
          [`@container (min-width: ${COMPACT_LAYOUT_MIN_WIDTH})`]: {
            gridTemplateColumns: '1fr auto',
            gridTemplateAreas: '"logo links"',
            gap: 'var(--space-4)',
            alignItems: 'center',
            justifyItems: 'stretch',
          },
          [`@container (min-width: ${HEADER_INLINE_MIN_WIDTH})`]: {
            gridTemplateColumns: 'auto minmax(0, 1fr)',
            gridTemplateAreas: '"logo links"',
            paddingBlock: 'var(--space-4)',
          },
        }}
      >
        <Link
          to="/"
          css={{
            color: 'var(--text)',
            gridArea: 'logo',
            width: '100%',
            maxWidth: '14rem',
          }}
          aria-label="eyepiece Home"
        >
          {/*
          `svg` `use` instead of `img` to allow CSS color control at the cost of no `alt` text
          still labeled for accessibility via `aria-label` but without a loading error fallback
        */}
          <svg
            width="100%"
            height="46"
            role="image"
            aria-label="eyepiece logo"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
              overflow: 'visible',
            }}
          >
            <use href={`${logo}#group`} />
          </svg>
        </Link>
        <div
          css={{
            gridArea: 'links',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            rowGap: 'var(--space-1)',
            columnGap: 'var(--space-3)',
            fontSize: 'var(--text-base)',
            lineHeight: 'var(--line-height-tight)',
            minWidth: 0,
            width: '100%',
            [`@container (min-width: ${COMPACT_LAYOUT_MIN_WIDTH})`]: {
              justifyContent: 'flex-end',
              width: 'auto',
            },
            [`@container (min-width: ${HEADER_INLINE_MIN_WIDTH})`]: {
              flexWrap: 'nowrap',
              columnGap: 'var(--space-4)',
            },
          }}
        >
          <ThemeToggleButton />
          <Link to="/favorites">Favorites</Link>
          <UserStatus />
        </div>
      </div>
    </nav>
  )
}
