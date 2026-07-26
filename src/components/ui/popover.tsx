import { Popover as RacPopover } from 'react-aria-components'
import { popover } from 'styled-system/recipes'
import { uiStyled } from './style-contract'

// popover companions pass through the adapter layer unstyled
export { Dialog, DialogTrigger } from 'react-aria-components'

export const Popover = uiStyled(RacPopover, popover)
