import { SearchField as RacSearchField } from 'react-aria-components'
import { searchField } from 'styled-system/recipes'
import { uiStyled } from './style-props'
import type { ComponentProps } from 'react'

export const SearchField = uiStyled(RacSearchField, searchField)

export type SearchFieldProps = ComponentProps<typeof SearchField>
