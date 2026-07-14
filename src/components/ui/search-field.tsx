import { SearchField as RacSearchField } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
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
      className={cx(
        css(
          {
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
          },
          cssProp,
        ),
        className,
      )}
      {...props}
    />
  )
}
