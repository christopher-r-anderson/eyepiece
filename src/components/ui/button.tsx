import { Button as ReactAriaButton } from 'react-aria-components'
import { css, cva, cx } from 'styled-system/css'
import type { Ref } from 'react'
import type { ButtonProps as RacButtonProps } from 'react-aria-components'
import type { StyleProps } from './style-props'

// exported for non-Button elements that need the same treatment
// (e.g. links styled as header actions)
export const ghostButtonCss = css.raw({
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  color: 'primary.textMuted',
  _hovered: {
    color: 'text',
    border:
      '1px solid color-mix(in oklab, token(colors.border) 88%, token(colors.text) 12%)',
    backgroundColor:
      'color-mix(in oklab, token(colors.tertiary.bg) 72%, token(colors.background) 28%)',
  },
})

const button = cva({
  base: {
    border: 'none',
    minHeight: 'controlHeight',
    // shorthand on purpose: caller padding overrides (shorthand or longhand)
    // must win the css() merge; a longhand base beats caller shorthands
    padding: 'token(spacing.2) token(spacing.4)',
    borderRadius: 'md',
    fontSize: 'base',
    fontWeight: 600,
    lineHeight: 'tight',
    gap: '2',
    cursor: 'pointer',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    transitionFast: 'background-color, color, transform',
    _focused: {
      outline: 'none',
    },
    _focusVisible: {
      outline: 'focusRing',
    },
    _pressed: {
      transform: 'translateY(1px)',
    },
    _disabled: {
      cursor: 'default',
      opacity: 0.7,
    },
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: 'primary.bg',
        color: 'primary.text',
        _disabled: { color: 'primary.textMuted' },
      },
      secondary: {
        border:
          '1px solid color-mix(in oklab, token(colors.border) 88%, token(colors.text) 12%)',
        backgroundColor: 'secondary.bg',
        color: 'secondary.text',
        _hovered: {
          backgroundColor:
            'color-mix(in oklab, token(colors.secondary.bg) 72%, token(colors.tertiary.bg) 28%)',
        },
        _disabled: { color: 'primary.textMuted' },
      },
      ghost: {
        ...ghostButtonCss,
      },
      bare: {
        backgroundColor: 'transparent',
        minHeight: 'auto',
        padding: 0,
        fontSize: '1em',
      },
    },
  },
})

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'bare'

export type ButtonProps = RacButtonProps & {
  ref?: Ref<HTMLButtonElement>
  icon?: React.ComponentType<{ size: number }>
  variant?: ButtonVariant
} & StyleProps

export function Button({
  children,
  variant = 'secondary',
  icon: Icon,
  css: cssProp,
  className,
  ...props
}: ButtonProps) {
  return (
    <ReactAriaButton
      className={cx(css(button.raw({ variant }), cssProp), className)}
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
