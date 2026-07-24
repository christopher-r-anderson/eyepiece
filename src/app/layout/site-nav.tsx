import { useRef } from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { useLandmark } from 'react-aria'
import { css, cx } from 'styled-system/css'
import type { ComponentPropsWithoutRef } from 'react'
import { Link } from '@/components/ui/link'
import { ThemeMenu } from '@/components/theme/theme-menu'
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
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          marginInlineStart: 'auto',
          flexShrink: 0,
          fontSize: 'control',
          mdDown: { gap: '3' },
        }),
        props.className,
      )}
    >
      <Link
        to="/favorites"
        css={{
          color: 'text.muted',
          _hovered: { color: 'text', textDecoration: 'none' },
          // narrow widths reach favorites through the user menu
          mdDown: { display: 'none' },
        }}
      >
        Favorites
      </Link>
      <ThemeMenu />
      <UserStatusClientIsland />
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
