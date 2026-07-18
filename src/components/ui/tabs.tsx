import {
  Tab as RacTab,
  TabList as RacTabList,
  TabPanel as RacTabPanel,
  TabPanels as RacTabPanels,
  Tabs as RacTabs,
} from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type {
  TabListProps as RacTabListProps,
  TabPanelProps as RacTabPanelProps,
  TabPanelsProps as RacTabPanelsProps,
  TabProps as RacTabProps,
  TabsProps as RacTabsProps,
} from 'react-aria-components'
import type { UiProps } from './style-contract'

export const tabListStyles = css.raw({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  alignItems: 'end',
  marginBottom: '-1px',
})

export const tabStyles = css.raw({
  minHeight: 'controlHeight',
  paddingBlock: '2',
  paddingInline: '4',
  border: 'default',
  borderBottomWidth: 0,
  borderTopRadius: 'md',
  backgroundColor: 'secondary.bg',
  color: 'secondary.text',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  outline: 'none',
  transitionFast: 'background-color, color',
  _selected: {
    fontWeight: 'bold',
    backgroundColor: 'tertiary.bg',
    position: 'relative',
    zIndex: 1,
  },
  _focusVisible: {
    outline: 'focusRing',
  },
})

export const tabPanelStyles = css.raw({
  backgroundColor: 'tertiary.bg',
  border: 'default',
  borderRadius: '0 token(radii.lg) token(radii.lg) token(radii.lg)',
  padding: '4',
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
