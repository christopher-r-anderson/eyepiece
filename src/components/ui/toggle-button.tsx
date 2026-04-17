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

const iconToggleButtonCss = {
  minHeight: 'auto',
  minWidth: 'auto',
  padding: 0,
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  backgroundColor: 'transparent',
  color: 'var(--toggle-icon-color, var(--text-muted))',
  transition:
    'color var(--transition-fast), filter var(--transition-fast), transform var(--transition-fast), outline-color var(--transition-fast)',
  '&[data-hovered]': {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: 'var(--toggle-icon-hover-color, var(--text))',
    filter:
      'drop-shadow(0 0 0.45rem var(--toggle-icon-hover-glow, transparent))',
  },
  '&[data-selected]': {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: 'var(--toggle-icon-selected-color, var(--text-accent))',
    filter:
      'drop-shadow(0 0 0.6rem var(--toggle-icon-selected-glow, transparent))',
  },
  '&[data-focus-visible]': {
    outline: '1px solid var(--outline-color)',
    outlineOffset: '3px',
  },
  '&[data-disabled]': {
    opacity: 0.5,
    cursor: 'default',
    filter: 'none',
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
  variant?: 'default' | 'subtle' | 'icon'
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
        variant === 'icon'
          ? iconToggleButtonCss
          : variant === 'subtle'
            ? subtleSelectedCss
            : defaultSelectedCss,
        cssProp,
      ]}
      {...props}
    />
  )
}
