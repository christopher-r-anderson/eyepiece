import { Button as ReactAriaButton } from 'react-aria-components'
import type { Ref } from 'react'
import type { ButtonProps as RacButtonProps } from 'react-aria-components'
import type { Interpolation, Theme } from '@emotion/react'

const buttonCss = {
  border: 'none',
  minHeight: 'var(--size-control-height)',
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  lineHeight: 'var(--line-height-tight)',
  gap: 'var(--space-2)',
  cursor: 'pointer',
  outline: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  transition:
    'background-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast)',
  '&[data-focused]': {
    outline: 'none',
  },
  '&[data-focus-visible]': {
    outline: '1px solid var(--outline-color)',
  },
  '&[data-pressed]': {
    transform: 'translateY(1px)',
  },
  '&[data-disabled]': {
    cursor: 'default',
    opacity: 0.7,
  },
}

const primaryCss = {
  backgroundColor: 'var(--primary-bg)',
  color: 'var(--primary-text)',
  '&[data-disabled]': { color: 'var(--primary-text-muted)' },
}

const secondaryCss = {
  border:
    '1px solid color-mix(in oklab, var(--border-color) 88%, var(--text) 12%)',
  backgroundColor: 'var(--secondary-bg)',
  color: 'var(--secondary-text)',
  '&[data-hovered]': {
    backgroundColor:
      'color-mix(in oklab, var(--secondary-bg) 72%, var(--tertiary-bg) 28%)',
  },
  '&[data-disabled]': { color: 'var(--primary-text-muted)' },
}

type ButtonVariant = 'primary' | 'secondary'

export type ButtonProps = RacButtonProps & {
  ref?: Ref<HTMLButtonElement>
  icon?: React.ComponentType<{ size: number }>
  variant?: ButtonVariant
  css?: Interpolation<Theme>
}

export function Button({
  children,
  variant = 'secondary',
  icon: Icon,
  css: cssProp,
  ...props
}: ButtonProps) {
  return (
    <ReactAriaButton
      css={[
        buttonCss,
        variant === 'primary' ? primaryCss : secondaryCss,
        cssProp,
      ]}
      {...props}
    >
      {(state) => (
        <>
          {typeof children === 'function' ? children(state) : children}
          {Icon && <Icon size={16} />}
        </>
      )}
    </ReactAriaButton>
  )
}
