import {
  Menu as RacMenu,
  MenuItem as RacMenuItem,
  Popover as RacPopover,
} from 'react-aria-components'
import type {
  MenuItemProps,
  MenuProps,
  PopoverProps as RacPopoverProps,
} from 'react-aria-components'

export function Menu<T extends object>(props: MenuProps<T>) {
  return (
    <RacMenu
      {...props}
      css={{
        backgroundColor: 'var(--secondary-bg)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: '12rem',
        borderRadius: 'inherit',
        overflow: 'hidden',
        // focus ring still shows *on the first menu item* when opening the menu via the keyboard
        '&:focus': {
          outline: 'none',
        },
      }}
    />
  )
}

export function MenuItem(props: MenuItemProps) {
  return (
    <RacMenuItem
      {...props}
      css={{
        color: 'var(--secondary-text)',
        padding: 'var(--space-2) var(--space-4)',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'var(--tertiary-bg)',
          color: 'var(--tertiary-text)',
        },
        outline: 'none',
        '&[data-focused]': {
          outline: 'none',
        },
        '&[data-focus-visible]': {
          outline: '1px solid var(--outline-color)',
        },
      }}
    />
  )
}

export function Popover(props: RacPopoverProps) {
  return (
    <RacPopover
      {...props}
      css={{
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--secondary-bg)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
      }}
    />
  )
}

export { MenuTrigger } from 'react-aria-components'
