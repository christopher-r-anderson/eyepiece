import { css } from 'styled-system/css'
import { Header } from './header'
import { Footer } from './footer'
import { SkipLink } from './skip-link'
import type { ReactNode } from 'react'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={css({
        backgroundColor: 'bg.canvas',
        color: 'text',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'screen',
      })}
    >
      <SkipLink />
      <Header />

      {children}

      <Footer />
    </div>
  )
}
