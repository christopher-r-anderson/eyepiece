import { SearchField as RacSearchField } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { searchField } from 'styled-system/recipes'
import type { ComponentProps } from 'react'
import type { StyleProps } from './style-props'

export type SearchFieldProps = ComponentProps<typeof RacSearchField> &
  StyleProps

export function SearchField({
  css: cssProp,
  className,
  ...props
}: SearchFieldProps) {
  return (
    <RacSearchField
      className={cx(searchField(), css(cssProp), className)}
      {...props}
    />
  )
}
