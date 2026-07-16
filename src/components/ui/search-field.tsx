import { SearchField as RacSearchField } from 'react-aria-components'
import { styled } from 'styled-system/jsx'
import { searchField } from 'styled-system/recipes'
import type { ComponentProps } from 'react'

export const SearchField = styled(RacSearchField, searchField)

export type SearchFieldProps = ComponentProps<typeof SearchField>
