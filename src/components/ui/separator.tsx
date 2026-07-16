import { Separator as RacSeparator } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { separator } from 'styled-system/recipes'
import type { ComponentProps } from 'react'
import type { StyleProps } from './style-props'

export type SeparatorProps = ComponentProps<typeof RacSeparator> & StyleProps

export function Separator({ css: cssProp, ...props }: SeparatorProps) {
  return <RacSeparator {...props} className={cx(separator(), css(cssProp))} />
}
