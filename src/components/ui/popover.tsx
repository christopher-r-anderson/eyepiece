import { Popover as RacPopover } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type { ComponentProps } from 'react'
import type { StyleProps } from './style-props'

const popoverStyles = css.raw({
  border: 'default',
  borderRadius: 'lg',
  backgroundColor: 'background',
  boxShadow: 'md',
  overflow: 'hidden',
})

export type PopoverProps = ComponentProps<typeof RacPopover> & StyleProps

export function Popover({ css: cssProp, className, ...props }: PopoverProps) {
  return (
    <RacPopover
      className={cx(css(popoverStyles, cssProp), className)}
      {...props}
    />
  )
}
