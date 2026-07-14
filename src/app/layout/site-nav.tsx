import { useRef } from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { useLandmark } from 'react-aria'
import { css, cx } from 'styled-system/css'
import type { ComponentPropsWithoutRef } from 'react'
import { Link } from '@/components/ui/link'
import ThemeSwitch from '@/components/theme/theme-switch'
import logo from '@/assets/eyepiece-logo.svg'
import { LoginLink } from '@/features/auth/components/login-link'
import { UserStatus } from '@/features/auth/components/user-status'

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
      className={cx(
        css({
          containerType: 'inline-size',
        }),
        props.className,
      )}
    >
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gridTemplateAreas: '"logo" "links"',
          gap: '2',
          justifyItems: 'center',
          alignItems: 'center',
          paddingBlock: '3',
          paddingInline: '4',
          _compactLayout: {
            gridTemplateColumns: '1fr auto',
            gridTemplateAreas: '"logo links"',
            gap: '4',
            alignItems: 'center',
            justifyItems: 'stretch',
          },
          _headerInline: {
            gridTemplateColumns: 'auto minmax(0, 1fr)',
            gridTemplateAreas: '"logo links"',
            paddingBlock: '4',
          },
        })}
      >
        <Link
          to="/"
          styles={css.raw({
            color: 'text',
            gridArea: 'logo',
            width: '100%',
            maxWidth: '14rem',
          })}
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
          className={css({
            gridArea: 'links',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            rowGap: '1',
            columnGap: '3',
            fontSize: 'base',
            lineHeight: 'tight',
            minWidth: 0,
            width: '100%',
            _compactLayout: {
              justifyContent: 'flex-end',
              width: 'auto',
            },
            _headerInline: {
              flexWrap: 'nowrap',
              columnGap: '4',
            },
          })}
        >
          <ThemeSwitch />
          <Link to="/favorites">Favorites</Link>
          <UserStatusClientIsland />
        </div>
      </div>
    </nav>
  )
}

function UserStatusClientIsland() {
  return (
    <ClientOnly fallback={<LoginLink />}>
      <UserStatus />
    </ClientOnly>
  )
}
