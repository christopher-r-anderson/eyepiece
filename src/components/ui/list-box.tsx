import { cloneElement, isValidElement } from 'react'
import {
  ListBox as RacListBox,
  ListBoxItem as RacListBoxItem,
} from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type {
  ListBoxItemProps as RacListBoxItemProps,
  ListBoxProps as RacListBoxProps,
} from 'react-aria-components'
import type { SystemStyleObject } from 'styled-system/types'

const listBoxStyles = css.raw({
  display: 'grid',
  gap: '1',
  minWidth: '16ch',
  padding: '2',
  borderRadius: 'lg',
  border:
    '1px solid color-mix(in oklab, token(colors.border) 85%, token(colors.text) 15%)',
  backgroundColor:
    'color-mix(in oklab, token(colors.secondary.bg) 92%, token(colors.background) 8%)',
  color: 'secondary.text',
  boxShadow: 'sm',
  outline: 'none',
})

const listBoxItemStyles = css.raw({
  paddingBlock: '2',
  paddingInline: '3',
  borderRadius: 'md',
  cursor: 'pointer',
  outline: 'none',
  transitionProperty: 'background-color, color',
  transitionDuration: 'fast',
  transitionTimingFunction: 'default',
  '&[data-hovered], &[data-focused], &[data-selected]': {
    backgroundColor: 'tertiary.bg',
    color: 'tertiary.text',
  },
  _focusVisible: {
    outline: '1px solid token(colors.outline)',
  },
})

const renderedItemContentStyles = css.raw({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  width: '100%',
  color: 'inherit',
  textDecoration: 'none',
})

export type ListBoxProps<T extends object> = RacListBoxProps<T> & {
  css?: SystemStyleObject
  className?: string
}

export function ListBox<T extends object>({
  css: cssProp,
  className,
  ...props
}: ListBoxProps<T>) {
  return (
    <RacListBox
      {...props}
      className={cx(css(listBoxStyles, cssProp), className)}
    />
  )
}

export type ListBoxItemProps = RacListBoxItemProps & {
  css?: SystemStyleObject
  className?: string
}

export function ListBoxItem({
  css: cssProp,
  className,
  render,
  ...props
}: ListBoxItemProps) {
  return (
    <RacListBoxItem
      {...props}
      className={cx(css(listBoxItemStyles, cssProp), className)}
      render={
        render
          ? (domProps, renderProps) => {
              const rendered = render(domProps, renderProps)

              if (!isValidElement(rendered)) {
                return rendered
              }

              const renderedElement = rendered as React.ReactElement<{
                className?: string
              }>

              return cloneElement(renderedElement, {
                className: cx(
                  css(renderedItemContentStyles),
                  renderedElement.props.className,
                ),
              })
            }
          : undefined
      }
    />
  )
}
