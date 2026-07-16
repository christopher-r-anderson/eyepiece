import { Button as ReactAriaButton } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { button } from 'styled-system/recipes'
import type { Ref } from 'react'
import type { ButtonProps as RacButtonProps } from 'react-aria-components'
import type { ButtonVariantProps } from 'styled-system/recipes'
import type { StyleProps } from './style-props'

export type ButtonProps = RacButtonProps & {
  ref?: Ref<HTMLButtonElement>
  icon?: React.ComponentType<{ size: number }>
} & ButtonVariantProps &
  StyleProps

export function Button({
  children,
  variant,
  icon: Icon,
  css: cssProp,
  className,
  ...props
}: ButtonProps) {
  return (
    <ReactAriaButton
      className={cx(button({ variant }), css(cssProp), className)}
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
