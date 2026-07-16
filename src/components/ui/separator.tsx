import { Separator as RacSeparator } from 'react-aria-components'
import { styled } from 'styled-system/jsx'
import { separator } from 'styled-system/recipes'
import type { ComponentProps } from 'react'

export const Separator = styled(RacSeparator, separator)

export type SeparatorProps = ComponentProps<typeof Separator>
