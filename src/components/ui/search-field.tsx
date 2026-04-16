import { SearchField as RacSearchField } from 'react-aria-components'
import type { ComponentProps } from 'react'
import type { Interpolation, Theme } from '@emotion/react'

const searchFieldCss = {
  display: 'inline-flex',
  alignItems: 'center',
  width: '100%',
  minHeight: 'var(--size-control-height)',
  paddingInline: 'var(--space-3)',
  gap: 'var(--space-2)',
  borderRadius: '999px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--tertiary-bg)',
  color: 'var(--text)',
  boxShadow: 'var(--shadow-sm)',
}

export type SearchFieldProps = ComponentProps<typeof RacSearchField> & {
  css?: Interpolation<Theme>
}

export function SearchField({ css: cssProp, ...props }: SearchFieldProps) {
  return <RacSearchField css={[searchFieldCss, cssProp]} {...props} />
}
