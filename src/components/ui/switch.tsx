import { Switch as RacSwitch } from 'react-aria-components'
import { styled } from 'styled-system/jsx'
import { switchRecipe } from 'styled-system/recipes'
import type { ComponentProps } from 'react'

export const Switch = styled(RacSwitch, switchRecipe)

export type SwitchProps = ComponentProps<typeof Switch>
