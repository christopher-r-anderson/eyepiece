import { Menu as RacMenu, MenuItem as RacMenuItem } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { menu, menuItem } from 'styled-system/recipes'
import type {
  MenuItemProps as RacMenuItemProps,
  MenuProps as RacMenuProps,
} from 'react-aria-components'
import type { StyleProps } from './style-props'

export type MenuProps<T extends object> = RacMenuProps<T> & StyleProps

export type MenuItemProps = RacMenuItemProps & StyleProps

export function Menu<T extends object>({
  css: styles,
  ...props
}: MenuProps<T>) {
  return <RacMenu {...props} className={cx(menu(), css(styles))} />
}

export function MenuItem({ css: styles, ...props }: MenuItemProps) {
  return <RacMenuItem {...props} className={cx(menuItem(), css(styles))} />
}

export { MenuTrigger } from 'react-aria-components'
