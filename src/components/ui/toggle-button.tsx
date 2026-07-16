import { ToggleButton as RacToggleButton } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { toggleButton } from 'styled-system/recipes'
import type { ComponentProps } from 'react'
import type { ToggleButtonVariantProps } from 'styled-system/recipes'
import type { StyleProps } from './style-props'

export type ToggleButtonProps = ComponentProps<typeof RacToggleButton> &
  ToggleButtonVariantProps &
  StyleProps

export function ToggleButton({
  variant,
  css: cssProp,
  ...props
}: ToggleButtonProps) {
  return (
    <RacToggleButton
      {...props}
      className={cx(toggleButton({ variant }), css(cssProp))}
    />
  )
}
