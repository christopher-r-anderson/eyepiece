import { SearchField as RacSearchField } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type { ComponentProps } from 'react'
import type { StyleProps } from './style-props'

const searchFieldStyles = css.raw({
  display: 'inline-flex',
  alignItems: 'center',
  width: '100%',
  minHeight: 'controlHeight',
  paddingInline: '3',
  gap: '2',
  borderRadius: 'full',
  border: 'default',
  backgroundColor: 'tertiary.bg',
  color: 'text',
  boxShadow: 'sm',
})

export type SearchFieldProps = ComponentProps<typeof RacSearchField> &
  StyleProps

export function SearchField({
  css: cssProp,
  className,
  ...props
}: SearchFieldProps) {
  return (
    <RacSearchField
      className={cx(css(searchFieldStyles, cssProp), className)}
      {...props}
    />
  )
}
