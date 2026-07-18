import {
  Tab as RacTab,
  TabList as RacTabList,
  TabPanel as RacTabPanel,
  TabPanels as RacTabPanels,
  Tabs as RacTabs,
} from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import {
  tabListStyles,
  tabPanelStyles,
  tabSelectedStyles,
  tabVisualStyles,
} from './tab.styles'
import type {
  TabListProps as RacTabListProps,
  TabPanelProps as RacTabPanelProps,
  TabPanelsProps as RacTabPanelsProps,
  TabProps as RacTabProps,
  TabsProps as RacTabsProps,
} from 'react-aria-components'
import type { UiProps } from './style-contract'

const tabStyles = css.raw({
  ...tabVisualStyles,
  _selected: tabSelectedStyles,
  _focusVisible: {
    outline: 'focusRing',
  },
})

export type TabsProps = UiProps<RacTabsProps>

export type TabListProps<T extends object> = UiProps<RacTabListProps<T>>

export type TabProps = UiProps<RacTabProps>

export type TabPanelsProps<T extends object> = UiProps<RacTabPanelsProps<T>>

export type TabPanelProps = UiProps<RacTabPanelProps>

export function Tabs({ css: cssProp, className, ...props }: TabsProps) {
  return (
    <RacTabs
      className={cx(
        css(
          {
            display: 'grid',
            gap: 0,
            width: '100%',
          },
          cssProp,
        ),
        className,
      )}
      {...props}
    />
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
      className={cx(css(tabListStyles, cssProp), className)}
    />
  )
}

export function Tab({ css: cssProp, className, ...props }: TabProps) {
  return (
    <RacTab {...props} className={cx(css(tabStyles, cssProp), className)} />
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
      className={cx(css({ display: 'grid' }, cssProp), className)}
    />
  )
}

export function TabPanel({ css: cssProp, className, ...props }: TabPanelProps) {
  return (
    <RacTabPanel
      {...props}
      className={cx(css(tabPanelStyles, cssProp), className)}
    />
  )
}
