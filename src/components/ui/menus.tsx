/** @jsxImportSource react */
import {
  Menu as RacMenu,
  MenuItem as RacMenuItem,
  Popover as RacPopover,
} from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type {
  MenuItemProps,
  MenuProps,
  PopoverProps as RacPopoverProps,
} from 'react-aria-components'

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
  return (
    <RacMenu
      {...props}
      className={cx(css(menuStyles), className as string | undefined)}
    />
  )
}

export function MenuItem({ className, ...props }: MenuItemProps) {
  return (
    <RacMenuItem
      {...props}
      className={cx(css(menuItemStyles), className as string | undefined)}
    />
  )
}

export function Popover({ className, ...props }: RacPopoverProps) {
  return (
    <RacPopover
      {...props}
      className={cx(css(menuPopoverStyles), className as string | undefined)}
    />
  )
}

export { MenuTrigger } from 'react-aria-components'
