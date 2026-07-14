import { Separator as RacSeparator } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type { ComponentProps } from 'react'
import type { SystemStyleObject } from 'styled-system/types'

const separatorStyles = css.raw({
  border: 0,
  borderTop: '1px solid token(colors.separator)',
  marginBlock: '1',
  marginInline: '2',
})

export type SeparatorProps = ComponentProps<typeof RacSeparator> & {
  css?: SystemStyleObject
  className?: string
}

export function Separator({
  css: cssProp,
  className,
  ...props
}: SeparatorProps) {
  return (
    <RacSeparator
      className={cx(css(separatorStyles, cssProp), className)}
      {...props}
    />
  )
}
