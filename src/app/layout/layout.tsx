import { css } from 'styled-system/css'
import { Header } from './header'
import { Footer } from './footer'
import type { ReactNode } from 'react'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={css({
        backgroundColor: 'background',
        color: 'text',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      })}
    >
      <Header />

      {children}

      <Footer />
    </div>
  )
}
