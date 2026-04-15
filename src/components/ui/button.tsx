import { Button as ReactAriaButton } from 'react-aria-components'
import type { Ref } from 'react'
import type { ButtonProps as RacButtonProps } from 'react-aria-components'

const buttonCss = {
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  fontSize: '1rem',
  gap: '0.5rem',
  cursor: 'pointer',
  outline: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&[data-focused]': {
    outline: 'none',
  },
  '&[data-focus-visible]': {
    outline: '1px solid var(--outline-color)',
  },
}

const primaryCss = {
  backgroundColor: 'var(--primary-bg)',
  color: 'var(--primary-text)',
  '&[data-disabled]': { color: 'var(--primary-text-muted)' },
}

const secondaryCss = {
  backgroundColor: 'var(--secondary-bg)',
  color: 'var(--secondary-text)',
  '&[data-disabled]': { color: 'var(--primary-text-muted)' },
}

type ButtonVariant = 'primary' | 'secondary'

export type ButtonProps = RacButtonProps & {
  ref?: Ref<HTMLButtonElement>
  icon?: React.ComponentType<{ size: number }>
  variant?: ButtonVariant
}

export function Button({
  children,
  variant = 'secondary',
  icon: Icon,
  ...props
}: ButtonProps) {
  return (
    <ReactAriaButton
      css={[buttonCss, variant === 'primary' ? primaryCss : secondaryCss]}
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
