import { cloneElement, isValidElement } from 'react'
import {
  ListBox as RacListBox,
  ListBoxItem as RacListBoxItem,
} from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { hstack } from 'styled-system/patterns'
import { listBox, listBoxItem } from 'styled-system/recipes'
import type {
  ListBoxItemProps as RacListBoxItemProps,
  ListBoxProps as RacListBoxProps,
} from 'react-aria-components'
import type { StyleProps } from './style-props'

const listBoxClass = listBox()
const listBoxItemClass = listBoxItem()

export type ListBoxProps<T extends object> = RacListBoxProps<T> & StyleProps

export function ListBox<T extends object>({
  css: cssProp,
  className,
  ...props
}: ListBoxProps<T>) {
  return (
    <RacListBox
      {...props}
      className={cx(listBoxClass, css(cssProp), className)}
    />
  )
}

export type ListBoxItemProps = RacListBoxItemProps & StyleProps

export function ListBoxItem({
  css: cssProp,
  className,
  render,
  ...props
}: ListBoxItemProps) {
  return (
    <RacListBoxItem
      {...props}
      className={cx(listBoxItemClass, css(cssProp), className)}
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
                  hstack({
                    gap: '2',
                    width: '100%',
                    color: 'inherit',
                    textDecoration: 'none',
                  }),
                  renderedElement.props.className,
                ),
              })
            }
          : undefined
      }
    />
  )
}
