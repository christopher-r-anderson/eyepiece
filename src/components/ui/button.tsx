import { Button as ReactAriaButton } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { button } from 'styled-system/recipes'
import type { Ref } from 'react'
import type { ButtonProps as RacButtonProps } from 'react-aria-components'
import type { ButtonVariantProps } from 'styled-system/recipes'
import type { UiProps } from './style-contract'

export type ButtonProps = {
  ref?: Ref<HTMLButtonElement>
  icon?: React.ComponentType<{ size: number }>
} & ButtonVariantProps &
  UiProps<RacButtonProps>

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
      {...props}
      className={cx(button({ variant }), css(cssProp), className)}
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
