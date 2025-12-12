import { Header } from './header'
import { Footer } from './footer'
import type { ReactNode } from 'react'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      css={{
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />

      <main
        css={{
          flexGrow: 1,
        }}
      >
        {children}
      </main>

      <Footer />
    </div>
  )
}
