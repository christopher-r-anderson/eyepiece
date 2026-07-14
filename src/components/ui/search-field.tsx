import { SearchField as RacSearchField } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type { ComponentProps } from 'react'
import type { SystemStyleObject } from 'styled-system/types'

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

export type SearchFieldProps = ComponentProps<typeof RacSearchField> & {
  css?: SystemStyleObject
  className?: string
}

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
