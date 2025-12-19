import { useRouterState } from '@tanstack/react-router'
import { SiteNav } from './site-nav'
import type { ComponentPropsWithoutRef } from 'react'
import { SearchBar } from '@/features/search/components/search-bar'

export function Header(props: ComponentPropsWithoutRef<'header'>) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })
  return (
    <header {...props}>
      <SiteNav>
        {pathname !== '/' && (
          <SearchBar css={{ marginRight: 'auto' }} allowDateRange={false} />
        )}
      </SiteNav>
    </header>
  )
}
