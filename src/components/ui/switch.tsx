import { Switch as RacSwitch } from 'react-aria-components'
import { css, cva, cx } from 'styled-system/css'
import type { ComponentProps } from 'react'
import type { StyleProps } from './style-props'

const switchRecipe = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 'calc(token(sizes.controlHeight) + token(spacing.4))',
    minHeight: 'controlHeight',
    padding: '2',
    border: 'default',
    borderRadius: 'full',
    backgroundColor: 'secondary.bg',
    color: 'secondary.text',
    cursor: 'pointer',
    lineHeight: 1,
    transitionFast: 'background-color, color, border-color',
    _selected: {
      backgroundColor: 'primary.bg',
      color: 'primary.text',
      borderColor: 'transparent',
    },
    _focusVisible: {
      outline: 'focusRing',
    },
    _disabled: {
      opacity: 0.6,
      cursor: 'default',
    },
  },
  variants: {
    variant: {
      default: {},
      subtle: {
        minWidth: '2.5rem',
        minHeight: '1.5rem',
        paddingBlock: '1',
        paddingInline: '2',
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        color: 'text.muted',
        _hovered: {
          backgroundColor: 'transparent',
          color: 'text',
        },
        _selected: {
          backgroundColor: 'transparent',
          color: 'text.accent',
        },
      },
    },
  },
})

type SwitchVariant = 'default' | 'subtle'

export type SwitchProps = ComponentProps<typeof RacSwitch> & {
  variant?: SwitchVariant
} & StyleProps

export function Switch({
  css: cssProp,
  className,
  variant = 'default',
  ...props
}: SwitchProps) {
  return (
    <RacSwitch
      className={cx(css(switchRecipe.raw({ variant }), cssProp), className)}
      {...props}
    />
  )
}
