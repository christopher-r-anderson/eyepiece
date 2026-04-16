import { Switch as RacSwitch } from 'react-aria-components'
import type { ComponentProps } from 'react'
import type { Interpolation, Theme } from '@emotion/react'

const switchCss = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 'calc(var(--size-control-height) + var(--space-4))',
  minHeight: 'var(--size-control-height)',
  padding: 'var(--space-2)',
  border: '1px solid var(--border-color)',
  borderRadius: '999px',
  backgroundColor: 'var(--secondary-bg)',
  color: 'var(--secondary-text)',
  cursor: 'pointer',
  lineHeight: 1,
  transition:
    'background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
  '&[data-selected]': {
    backgroundColor: 'var(--primary-bg)',
    color: 'var(--primary-text)',
    borderColor: 'transparent',
  },
  '&[data-focus-visible]': {
    outline: '1px solid var(--outline-color)',
  },
  '&[data-disabled]': {
    opacity: 0.6,
    cursor: 'default',
  },
}

const subtleSwitchCss = {
  minWidth: '2.5rem',
  minHeight: '1.5rem',
  padding: 'var(--space-1) var(--space-2)',
  borderColor: 'transparent',
  backgroundColor: 'transparent',
  color: 'var(--text-muted)',
  '&[data-hovered]': {
    backgroundColor: 'transparent',
    color: 'var(--text)',
  },
  '&[data-selected]': {
    backgroundColor: 'transparent',
    color: 'var(--text-accent)',
  },
}

type SwitchVariant = 'default' | 'subtle'

export type SwitchProps = ComponentProps<typeof RacSwitch> & {
  css?: Interpolation<Theme>
  variant?: SwitchVariant
}

export function Switch({
  css: cssProp,
  variant = 'default',
  ...props
}: SwitchProps) {
  return (
    <RacSwitch
      css={[switchCss, variant === 'subtle' ? subtleSwitchCss : null, cssProp]}
      {...props}
    />
  )
}
