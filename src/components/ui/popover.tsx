import { Popover as RacPopover } from 'react-aria-components'
import { styled } from 'styled-system/jsx'
import { popover } from 'styled-system/recipes'
import type { ComponentProps } from 'react'

export const Popover = styled(RacPopover, popover)

export type PopoverProps = ComponentProps<typeof Popover>
