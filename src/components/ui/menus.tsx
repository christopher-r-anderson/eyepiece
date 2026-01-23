import { Menu as RacMenu, MenuItem as RacMenuItem } from 'react-aria-components'
import type { MenuItemProps, MenuProps } from 'react-aria-components'

export function Menu<T extends object>(props: MenuProps<T>) {
  return (
    <RacMenu
      {...props}
      css={{
        backgroundColor: 'var(--secondary-bg)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        minWidth: '10rem',
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
        padding: '0.5rem 1rem',
        borderRadius: '4px',
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

export { MenuTrigger, Popover } from 'react-aria-components'
