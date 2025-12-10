import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { SidebarNav } from './SidebarNav'

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
