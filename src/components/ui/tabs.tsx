import {
  Tab as RacTab,
  TabList as RacTabList,
  TabPanel as RacTabPanel,
  TabPanels as RacTabPanels,
  Tabs as RacTabs,
} from 'react-aria-components'
import { css, cx } from 'styled-system/css'
import type { ComponentProps } from 'react'
import type { StyleProps } from './style-props'

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

export type TabsProps = ComponentProps<typeof RacTabs> & StyleProps

export type TabListProps = ComponentProps<typeof RacTabList> & StyleProps

export type TabProps = ComponentProps<typeof RacTab> & StyleProps

export type TabPanelsProps = ComponentProps<typeof RacTabPanels> & StyleProps

export type TabPanelProps = ComponentProps<typeof RacTabPanel> & StyleProps

export function Tabs({ css: cssProp, ...props }: TabsProps) {
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
      )}
      {...props}
    />
  )
}

export function TabList({ css: cssProp, ...props }: TabListProps) {
  return <RacTabList {...props} className={cx(css(tabListStyles, cssProp))} />
}

export function Tab({ css: cssProp, ...props }: TabProps) {
  return <RacTab {...props} className={cx(css(tabStyles, cssProp))} />
}

export function TabPanels({ css: cssProp, ...props }: TabPanelsProps) {
  return (
    <RacTabPanels
      {...props}
      className={cx(css({ display: 'grid' }, cssProp))}
    />
  )
}

export function TabPanel({ css: cssProp, ...props }: TabPanelProps) {
  return <RacTabPanel {...props} className={cx(css(tabPanelStyles, cssProp))} />
}
