import { Switch as RacSwitch } from 'react-aria-components'
import { switchRecipe } from 'styled-system/recipes'
import { uiStyled } from './style-contract'
import type { ComponentProps } from 'react'

export const Switch = uiStyled(RacSwitch, switchRecipe)

export type SwitchProps = ComponentProps<typeof Switch>
