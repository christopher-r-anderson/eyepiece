/** @jsxImportSource react */
import {
  Menu as RacMenu,
  MenuItem as RacMenuItem,
  Popover as RacPopover,
} from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type {
  MenuItemProps as RacMenuItemProps,
  MenuProps as RacMenuProps,
  PopoverProps as RacPopoverProps,
} from 'react-aria-components'

export type MenuProps<T extends object> = RacMenuProps<T> & {
  className?: string
}

export type MenuItemProps = RacMenuItemProps & {
  className?: string
}

export type PopoverProps = RacPopoverProps & {
  className?: string
}

const menuStyles = css.raw({
  backgroundColor: 'secondary.bg',
  display: 'flex',
  flexDirection: 'column',
  minWidth: '12rem',
  borderRadius: 'inherit',
  overflow: 'hidden',
  // focus ring still shows *on the first menu item* when opening the menu via the keyboard
  '&:focus': {
    outline: 'none',
  },
})

const menuItemStyles = css.raw({
  color: 'secondary.text',
  paddingBlock: '2',
  paddingInline: '4',
  borderRadius: 'sm',
  cursor: 'pointer',
  _hovered: {
    backgroundColor: 'tertiary.bg',
    color: 'tertiary.text',
  },
  outline: 'none',
  _focused: {
    outline: 'none',
  },
  _focusVisible: {
    outline: '1px solid token(colors.outline)',
  },
})

const menuPopoverStyles = css.raw({
  border: '1px solid token(colors.border)',
  borderRadius: 'lg',
  backgroundColor: 'secondary.bg',
  boxShadow: 'md',
  overflow: 'hidden',
})

export function Menu<T extends object>({ className, ...props }: MenuProps<T>) {
  return <RacMenu {...props} className={cx(css(menuStyles), className)} />
}

export function MenuItem({ className, ...props }: MenuItemProps) {
  return (
    <RacMenuItem {...props} className={cx(css(menuItemStyles), className)} />
  )
}

export function Popover({ className, ...props }: PopoverProps) {
  return (
    <RacPopover {...props} className={cx(css(menuPopoverStyles), className)} />
  )
}

export { MenuTrigger } from 'react-aria-components'
