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
import type { SystemStyleObject } from 'styled-system/types'

export type MenuProps<T extends object> = RacMenuProps<T> & {
  styles?: SystemStyleObject
  className?: string
}

export type MenuItemProps = RacMenuItemProps & {
  styles?: SystemStyleObject
  className?: string
}

export type PopoverProps = RacPopoverProps & {
  styles?: SystemStyleObject
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

export function Menu<T extends object>({
  styles,
  className,
  ...props
}: MenuProps<T>) {
  return (
    <RacMenu {...props} className={cx(css(menuStyles, styles), className)} />
  )
}

export function MenuItem({ styles, className, ...props }: MenuItemProps) {
  return (
    <RacMenuItem
      {...props}
      className={cx(css(menuItemStyles, styles), className)}
    />
  )
}

export function Popover({ styles, className, ...props }: PopoverProps) {
  return (
    <RacPopover
      {...props}
      className={cx(css(menuPopoverStyles, styles), className)}
    />
  )
}

export { MenuTrigger } from 'react-aria-components'
