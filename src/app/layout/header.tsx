import { useLocation } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { SiteNav } from './site-nav'
import { Brand } from './brand'
import { HeaderSearch } from './header-search'
import type { ComponentPropsWithoutRef } from 'react'

export function Header(props: ComponentPropsWithoutRef<'header'>) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const isHome = pathname === '/'
  // /search integrates the header field with its form mechanics in a
  // follow-up; until then it keeps its on-page bar and the header stays bare
  const isSearchPage = pathname.startsWith('/search')
  const hasSearch = !isHome && !isSearchPage
  return (
    <header
      {...props}
      className={css({
        position: 'sticky',
        top: 0,
        zIndex: 'sticky',
        backgroundColor: 'bg.canvas',
        borderBottom: 'default',
      })}
    >
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          maxWidth: 'pageMax',
          width: '100%',
          marginInline: 'auto',
          paddingBlock: '16px 10px',
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
