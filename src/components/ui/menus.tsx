import { Menu as RacMenu, MenuItem as RacMenuItem } from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { styled } from 'styled-system/jsx'
import { menu, menuItem } from 'styled-system/recipes'
import type { ComponentProps } from 'react'
import type { MenuProps as RacMenuProps } from 'react-aria-components'
import type { StyleProps } from './style-props'

export type MenuProps<T extends object> = RacMenuProps<T> & StyleProps

// hand-written: styled() cannot carry RacMenu's generic item type
export function Menu<T extends object>({
  css: styles,
  className,
  ...props
}: MenuProps<T>) {
  return <RacMenu {...props} className={cx(menu(), css(styles), className)} />
}

export const MenuItem = styled(RacMenuItem, menuItem)

export type MenuItemProps = ComponentProps<typeof MenuItem>

export { MenuTrigger } from 'react-aria-components'
