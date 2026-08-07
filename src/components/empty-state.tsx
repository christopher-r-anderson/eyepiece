import { css } from 'styled-system/css'
import type { ReactNode } from 'react'

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    // the audit scripts read the marker as page-settled
    <p
      data-empty-state
      className={css({ color: 'text.muted', maxWidth: 'readingMax' })}
    >
      {children}
    </p>
  )
}
