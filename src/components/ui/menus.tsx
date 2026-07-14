import { Menu as RacMenu, MenuItem as RacMenuItem } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type {
  MenuItemProps as RacMenuItemProps,
  MenuProps as RacMenuProps,
} from 'react-aria-components'
import type { StyleProps } from './style-props'

export type MenuProps<T extends object> = RacMenuProps<T> & StyleProps

export type MenuItemProps = RacMenuItemProps & StyleProps

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
    outline: 'focusRing',
  },
})

export function Menu<T extends object>({
  css: styles,
  className,
  ...props
}: MenuProps<T>) {
  return (
    <RacMenu {...props} className={cx(css(menuStyles, styles), className)} />
  )
}

export function MenuItem({ css: styles, className, ...props }: MenuItemProps) {
  return (
    <RacMenuItem
      {...props}
      className={cx(css(menuItemStyles, styles), className)}
    />
  )
}

export { MenuTrigger } from 'react-aria-components'
