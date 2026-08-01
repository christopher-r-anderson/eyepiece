import { css } from 'styled-system/css'
import type { ReactNode } from 'react'

export function AuthAltAction({ children }: { children: ReactNode }) {
  return (
    <p className={css({ lineHeight: 'base', color: 'text.muted' })}>
      {children}
    </p>
  )
}
