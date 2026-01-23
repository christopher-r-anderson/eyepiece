import { Button as ReactAriaButton } from 'react-aria-components'
import type { ButtonVariant } from './types'
import type { ButtonProps as RacButtonProps } from 'react-aria-components'

export const buttonCss = {
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

export const getButtonVariantStyles = (variant: ButtonVariant) => {
  return {
    backgroundColor:
      variant === 'primary' ? 'var(--primary-bg)' : 'var(--secondary-bg)',
    color:
      variant === 'primary' ? 'var(--primary-text)' : 'var(--secondary-text)',
  }
}

type ButtonProps = RacButtonProps & {
  variant?: ButtonVariant
}

export function Button({ variant = 'secondary', ...props }: ButtonProps) {
  return (
    <ReactAriaButton
      css={buttonCss}
      style={getButtonVariantStyles(variant)}
      {...props}
    />
  )
}
