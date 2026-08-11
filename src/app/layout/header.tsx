import { useLocation } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { SiteNav } from './site-nav'
import { Brand } from './brand'
import { HeaderSearch } from './header-search'
import type { ComponentPropsWithoutRef } from 'react'

export function Header(props: ComponentPropsWithoutRef<'header'>) {
  const pathname = useLocation({ select: (location) => location.pathname })
  // home is hero-only
  const isHome = pathname === '/'
  const hasSearch = !isHome
  return (
    <header
      {...props}
      className={cx(
        css({
          position: 'sticky',
          top: '0',
          zIndex: 'sticky',
          backgroundColor: 'bg.canvas',
          borderBottom: 'default',
        }),
        props.className,
      )}
    >
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '[20px]',
          maxWidth: 'pageMax',
          width: 'full',
          marginInline: 'auto',
          paddingBlock: '[16px 10px]',
          paddingInline: 'pageInline',
          mdDown: { gap: '3' },
        })}
      >
        <Brand fullWordmark={isHome} hideWordmarkWhenNarrow={hasSearch} />
        {hasSearch && <HeaderSearch />}
        <SiteNav />
      </div>
    </header>
  )
}
