import { Popover as RacPopover } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { popover } from 'styled-system/recipes'
import type { ComponentProps } from 'react'
import type { StyleProps } from './style-props'

export type PopoverProps = ComponentProps<typeof RacPopover> & StyleProps

export function Popover({ css: cssProp, ...props }: PopoverProps) {
  return <RacPopover {...props} className={cx(popover(), css(cssProp))} />
}
