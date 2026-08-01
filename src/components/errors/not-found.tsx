import { css } from 'styled-system/css'
import type { ReactNode } from 'react'
import { PageHeader } from '@/components/page-header'

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
      <PageHeader title={title} meta={meta} />
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
