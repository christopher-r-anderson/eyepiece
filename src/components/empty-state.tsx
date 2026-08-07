import { css } from 'styled-system/css'
import type { ReactNode } from 'react'

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p
      data-audit-empty-state
      className={css({ color: 'text.muted', maxWidth: 'readingMax' })}
    >
      {children}
    </p>
  )
}
