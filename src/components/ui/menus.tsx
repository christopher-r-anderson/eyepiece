import { Menu as RacMenu, MenuItem as RacMenuItem } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { menu, menuItem } from 'styled-system/recipes'
import { uiStyled } from './style-props'
import type { MenuProps as RacMenuProps } from 'react-aria-components'
import type { UiProps } from './style-props'

const menuClass = menu()

export type MenuProps<T extends object> = UiProps<RacMenuProps<T>>

// hand-written: styled() cannot carry RacMenu's generic item type
export function Menu<T extends object>({
  css: styles,
  className,
  ...props
}: MenuProps<T>) {
  return (
    <RacMenu {...props} className={cx(menuClass, css(styles), className)} />
  )
}

export const MenuItem = uiStyled(RacMenuItem, menuItem)

export { MenuTrigger } from 'react-aria-components'
