import {
  Tab as RacTab,
  TabList as RacTabList,
  TabPanel as RacTabPanel,
  TabPanels as RacTabPanels,
  Tabs as RacTabs,
} from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type { ComponentProps } from 'react'
import type { SystemStyleObject } from 'styled-system/types'

const tabsStyles = css.raw({
  display: 'grid',
  gap: 0,
  width: '100%',
})

export const tabListStyles = css.raw({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  alignItems: 'end',
  marginBottom: '-1px',
})

const tabPanelsStyles = css.raw({
  display: 'grid',
})

export const tabStyles = css.raw({
  minHeight: 'controlHeight',
  paddingBlock: '2',
  paddingInline: '4',
  border: '1px solid token(colors.border)',
  borderBottomWidth: 0,
  borderTopRadius: 'md',
  backgroundColor: 'secondary.bg',
  color: 'secondary.text',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  outline: 'none',
  transitionProperty: 'background-color, color',
  transitionDuration: 'fast',
  transitionTimingFunction: 'default',
  _selected: {
    fontWeight: 'bold',
    backgroundColor: 'tertiary.bg',
    position: 'relative',
    zIndex: 1,
  },
  _focusVisible: {
    outline: '1px solid token(colors.outline)',
  },
})

export const tabPanelStyles = css.raw({
  backgroundColor: 'tertiary.bg',
  border: '1px solid token(colors.border)',
  borderRadius: '0 token(radii.lg) token(radii.lg) token(radii.lg)',
  padding: '4',
})

export type TabsProps = ComponentProps<typeof RacTabs> & {
  css?: SystemStyleObject
  className?: string
}

export type TabListProps = ComponentProps<typeof RacTabList> & {
  css?: SystemStyleObject
  className?: string
}

export type TabProps = ComponentProps<typeof RacTab> & {
  css?: SystemStyleObject
  className?: string
}

export type TabPanelsProps = ComponentProps<typeof RacTabPanels> & {
  css?: SystemStyleObject
  className?: string
}

export type TabPanelProps = ComponentProps<typeof RacTabPanel> & {
  css?: SystemStyleObject
  className?: string
}

export function Tabs({ css: cssProp, className, ...props }: TabsProps) {
  return (
    <RacTabs className={cx(css(tabsStyles, cssProp), className)} {...props} />
  )
}

export function TabList({ css: cssProp, className, ...props }: TabListProps) {
  return (
    <RacTabList
      className={cx(css(tabListStyles, cssProp), className)}
      {...props}
    />
  )
}

export function Tab({ css: cssProp, className, ...props }: TabProps) {
  return (
    <RacTab className={cx(css(tabStyles, cssProp), className)} {...props} />
  )
}

export function TabPanels({
  css: cssProp,
  className,
  ...props
}: TabPanelsProps) {
  return (
    <RacTabPanels
      className={cx(css(tabPanelsStyles, cssProp), className)}
      {...props}
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
