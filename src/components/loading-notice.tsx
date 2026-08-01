import { css, cx } from 'styled-system/css'
import type { ReactNode } from 'react'

const loadingNoticeCss = css({
  textStyle: 'meta',
  textTransform: 'lowercase',
  color: 'text.muted',
})

export function LoadingNotice({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p role="status" className={cx(loadingNoticeCss, className)}>
      {children}
    </p>
  )
}
