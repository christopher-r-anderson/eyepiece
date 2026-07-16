import { Switch as RacSwitch } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { switchRecipe } from 'styled-system/recipes'
import type { ComponentProps } from 'react'
import type { SwitchRecipeVariantProps } from 'styled-system/recipes'
import type { StyleProps } from './style-props'

export type SwitchProps = ComponentProps<typeof RacSwitch> &
  SwitchRecipeVariantProps &
  StyleProps

export function Switch({
  css: cssProp,
  className,
  variant,
  ...props
}: SwitchProps) {
  return (
    <RacSwitch
      className={cx(switchRecipe({ variant }), css(cssProp), className)}
      {...props}
    />
  )
}
