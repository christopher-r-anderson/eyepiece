import {
  Tab as RacTab,
  TabList as RacTabList,
  TabPanel as RacTabPanel,
  TabPanels as RacTabPanels,
  Tabs as RacTabs,
} from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import { tabs } from 'styled-system/recipes'
import type {
  TabListProps as RacTabListProps,
  TabPanelProps as RacTabPanelProps,
  TabPanelsProps as RacTabPanelsProps,
  TabProps as RacTabProps,
  TabsProps as RacTabsProps,
} from 'react-aria-components'
import type { UiProps } from './style-contract'

const slots = tabs()

export type TabsProps = UiProps<RacTabsProps>

export type TabListProps<T extends object> = UiProps<RacTabListProps<T>>

export type TabProps = UiProps<RacTabProps>

export type TabPanelsProps<T extends object> = UiProps<RacTabPanelsProps<T>>

export type TabPanelProps = UiProps<RacTabPanelProps>

export function Tabs({ css: cssProp, className, ...props }: TabsProps) {
  return (
    <RacTabs {...props} className={cx(slots.root, css(cssProp), className)} />
  )
}

export function TabList<T extends object>({
  css: cssProp,
  className,
  ...props
}: TabListProps<T>) {
  return (
    <RacTabList
      {...props}
      className={cx(slots.list, css(cssProp), className)}
    />
  )
}

export function Tab({ css: cssProp, className, ...props }: TabProps) {
  return (
    <RacTab {...props} className={cx(slots.tab, css(cssProp), className)} />
  )
}

export function TabPanels<T extends object>({
  css: cssProp,
  className,
  ...props
}: TabPanelsProps<T>) {
  return (
    <RacTabPanels
      {...props}
      className={cx(slots.panels, css(cssProp), className)}
    />
  )
}

export function TabPanel({ css: cssProp, className, ...props }: TabPanelProps) {
  return (
    <RacTabPanel
      {...props}
      className={cx(slots.panel, css(cssProp), className)}
    />
  )
}
