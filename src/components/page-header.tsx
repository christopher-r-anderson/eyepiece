import { css } from 'styled-system/css'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  meta,
}: {
  title: ReactNode
  meta?: ReactNode
}) {
  return (
    <div>
      <h1
        className={css({
          textStyle: 'display.md',
          overflowWrap: 'anywhere',
        })}
      >
        {title}
      </h1>
      {meta != null && (
        <p
          className={css({
            marginTop: '2',
            textStyle: 'meta',
            textTransform: 'lowercase',
            color: 'text.muted',
          })}
        >
          {meta}
        </p>
      )}
    </div>
  )
}
