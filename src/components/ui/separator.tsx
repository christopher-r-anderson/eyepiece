import { Separator as RacSeparator } from 'react-aria-components'
import type { ComponentProps } from 'react'
import type { Interpolation, Theme } from '@emotion/react'

const separatorCss = {
  border: 0,
  borderTop: '1px solid var(--separator-color)',
  margin: 'var(--space-1) var(--space-2)',
}

export type SeparatorProps = ComponentProps<typeof RacSeparator> & {
  css?: Interpolation<Theme>
}

export function Separator({ css: cssProp, ...props }: SeparatorProps) {
  return <RacSeparator css={[separatorCss, cssProp]} {...props} />
}
