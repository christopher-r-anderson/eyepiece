import { cloneElement, isValidElement } from 'react'
import {
  ListBox as RacListBox,
  ListBoxItem as RacListBoxItem,
} from 'react-aria-components'
import type {
  ListBoxItemProps as RacListBoxItemProps,
  ListBoxProps as RacListBoxProps,
} from 'react-aria-components'
import type { Interpolation, Theme } from '@emotion/react'

const listBoxCss = {
  display: 'grid',
  gap: 'var(--space-1)',
  minWidth: '12rem',
  padding: 'var(--space-2)',
  borderRadius: 'var(--radius-lg)',
  border:
    '1px solid color-mix(in oklab, var(--border-color) 85%, var(--text) 15%)',
  backgroundColor:
    'color-mix(in oklab, var(--secondary-bg) 92%, var(--background) 8%)',
  color: 'var(--secondary-text)',
  boxShadow: 'var(--shadow-sm)',
  outline: 'none',
}

const listBoxItemCss = {
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  outline: 'none',
  transition:
    'background-color var(--transition-fast), color var(--transition-fast)',
  '&[data-hovered], &[data-focused], &[data-selected]': {
    backgroundColor: 'var(--tertiary-bg)',
    color: 'var(--tertiary-text)',
  },
  '&[data-focus-visible]': {
    outline: '1px solid var(--outline-color)',
  },
}

const renderedItemContentCss = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  width: '100%',
  color: 'inherit',
  textDecoration: 'none',
}

export type ListBoxProps<T extends object> = RacListBoxProps<T> & {
  css?: Interpolation<Theme>
}

export function ListBox<T extends object>({
  css: cssProp,
  ...props
}: ListBoxProps<T>) {
  return <RacListBox {...props} css={[listBoxCss, cssProp]} />
}

export type ListBoxItemProps = RacListBoxItemProps & {
  css?: Interpolation<Theme>
}

export function ListBoxItem({
  css: cssProp,
  render,
  ...props
}: ListBoxItemProps) {
  return (
    <RacListBoxItem
      {...props}
      css={[listBoxItemCss, cssProp]}
      render={
        render
          ? (domProps, renderProps) => {
              const rendered = render(domProps, renderProps)

              if (!isValidElement(rendered)) {
                return rendered
              }

              const renderedElement = rendered as React.ReactElement<{
                css?: Interpolation<Theme>
              }>

              return cloneElement(renderedElement, {
                css: [renderedItemContentCss, renderedElement.props.css],
              })
            }
          : undefined
      }
    />
  )
}
