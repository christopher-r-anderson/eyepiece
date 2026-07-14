import { Popover as RacPopover } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type { ComponentProps } from 'react'
import type { SystemStyleObject } from 'styled-system/types'

const popoverStyles = css.raw({
  border: 'default',
  borderRadius: 'lg',
  backgroundColor: 'background',
  boxShadow: 'md',
  overflow: 'hidden',
})

export type PopoverProps = ComponentProps<typeof RacPopover> & {
  css?: SystemStyleObject
  className?: string
}

export function Popover({ css: cssProp, className, ...props }: PopoverProps) {
  return (
    <RacPopover
      className={cx(css(popoverStyles, cssProp), className)}
      {...props}
    />
  )
}
