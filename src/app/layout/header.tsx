import { SiteNav } from './site-nav'
import type { ComponentPropsWithoutRef } from 'react'

export function Header(props: ComponentPropsWithoutRef<'header'>) {
  return (
    <header {...props}>
      <SiteNav />
    </header>
  )
}
