import type { ReactNode } from 'react'
import { Header } from './header'
import { Footer } from './footer'
import { SidebarNav } from './site-nav'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Header />
      <SidebarNav />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
