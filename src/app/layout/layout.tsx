import { Header } from './header'
import { Footer } from './footer'
import type { ReactNode } from 'react'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      css={{
        backgroundColor: 'var(--background)',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Header />

      <main style={{ flex: 1 }}>{children}</main>

      <Footer />
    </div>
  )
}
