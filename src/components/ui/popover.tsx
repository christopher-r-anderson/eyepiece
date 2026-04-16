import { Popover as RacPopover } from 'react-aria-components'
import type { ComponentProps } from 'react'
import type { Interpolation, Theme } from '@emotion/react'

const popoverCss = {
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--background)',
  boxShadow: 'var(--shadow-md)',
  overflow: 'hidden',
}

export type PopoverProps = ComponentProps<typeof RacPopover> & {
  css?: Interpolation<Theme>
}

export function Popover({ css: cssProp, ...props }: PopoverProps) {
  return <RacPopover css={[popoverCss, cssProp]} {...props} />
}
