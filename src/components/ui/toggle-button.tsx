import { ToggleButton as RacToggleButton } from 'react-aria-components'
import type { ComponentProps } from 'react'
import type { Interpolation, Theme } from '@emotion/react'

const toggleButtonCss = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'var(--size-control-height)',
  minWidth: 'var(--size-control-height)',
  padding: 'var(--space-2)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  lineHeight: 1,
  transition:
    'background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
  '&[data-hovered]': {
    backgroundColor: 'var(--tertiary-bg)',
    color: 'var(--tertiary-text)',
  },
  '&[data-selected]': {
    backgroundColor: 'var(--secondary-bg)',
    color: 'var(--text-accent)',
    borderColor: 'var(--border-color)',
  },
  '&[data-focus-visible]': {
    outline: '1px solid var(--outline-color)',
  },
  '&[data-disabled]': {
    opacity: 0.6,
    cursor: 'default',
  },
}

const defaultSelectedCss = {
  '&[data-selected]': {
    backgroundColor: 'var(--secondary-bg)',
    color: 'var(--text-accent)',
    borderColor: 'var(--border-color)',
  },
}

const subtleSelectedCss = {
  '&[data-selected]': {
    backgroundColor: 'transparent',
    color: 'var(--text-accent)',
    borderColor: 'transparent',
  },
}

export type ToggleButtonProps = ComponentProps<typeof RacToggleButton> & {
  variant?: 'default' | 'subtle'
  css?: Interpolation<Theme>
}

export function ToggleButton({
  variant = 'default',
  css: cssProp,
  ...props
}: ToggleButtonProps) {
  return (
    <RacToggleButton
      css={[
        toggleButtonCss,
        variant === 'subtle' ? subtleSelectedCss : defaultSelectedCss,
        cssProp,
      ]}
      {...props}
    />
  )
}
