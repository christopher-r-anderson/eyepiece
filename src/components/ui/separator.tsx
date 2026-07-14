import { Separator as RacSeparator } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type { ComponentProps } from 'react'
import type { StyleProps } from './style-props'

const separatorStyles = css.raw({
  border: 0,
  borderTop: 'separator',
  marginBlock: '1',
  marginInline: '2',
})

export type SeparatorProps = ComponentProps<typeof RacSeparator> & StyleProps

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
