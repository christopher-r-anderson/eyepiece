import { Button as ReactAriaButton } from 'react-aria-components'
import type { ButtonProps as RacButtonProps } from 'react-aria-components'

const buttonCss = {
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  fontSize: '1rem',
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
  variant?: ButtonVariant
}

export function Button({ variant = 'secondary', ...props }: ButtonProps) {
  return (
    <ReactAriaButton
      css={[buttonCss, variant === 'primary' ? primaryCss : secondaryCss]}
      {...props}
    />
  )
}
