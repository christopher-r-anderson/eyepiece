import { css } from 'styled-system/css'
import type { ReactNode } from 'react'

export function NotFound({
  title,
  meta,
  message,
}: {
  title: string
  meta?: string
  message: ReactNode
}) {
  return (
    <div>
      <h1 className={css({ textStyle: 'display.md' })}>{title}</h1>
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
      <p
        className={css({
          marginTop: meta != null ? '5' : '2',
          color: 'text.muted',
          maxWidth: 'readingMax',
        })}
      >
        {message}
      </p>
    </div>
  )
}
