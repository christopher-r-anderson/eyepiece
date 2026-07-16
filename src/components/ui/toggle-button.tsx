import { ToggleButton as RacToggleButton } from 'react-aria-components'
import { styled } from 'styled-system/jsx'
import { toggleButton } from 'styled-system/recipes'
import type { ComponentProps } from 'react'

export const ToggleButton = styled(RacToggleButton, toggleButton)

export type ToggleButtonProps = ComponentProps<typeof ToggleButton>
