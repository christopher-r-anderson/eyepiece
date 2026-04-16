import {
  Tab as RacTab,
  TabList as RacTabList,
  TabPanel as RacTabPanel,
  TabPanels as RacTabPanels,
  Tabs as RacTabs,
} from 'react-aria-components'
import type { ComponentProps } from 'react'
import type { Interpolation, Theme } from '@emotion/react'

const tabsCss = {
  display: 'grid',
  gap: 0,
  width: '100%',
}

const tabListCss = {
  display: 'flex' as const,
  flexWrap: 'wrap' as const,
  gap: 'var(--space-2)',
  alignItems: 'end' as const,
  marginBottom: '-1px',
}

const tabPanelsCss = {
  display: 'grid',
}

const tabCss = {
  minHeight: 'var(--size-control-height)',
  padding: 'var(--space-2) var(--space-4)',
  border: '1px solid var(--border-color)',
  borderBottomWidth: 0,
  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
  backgroundColor: 'var(--secondary-bg)',
  color: 'var(--secondary-text)',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  outline: 'none',
  transition:
    'background-color var(--transition-fast), color var(--transition-fast)',
  '&[data-current="true"],&[data-selected="true"]': {
    fontWeight: 'bold',
    backgroundColor: 'var(--tertiary-bg)',
    position: 'relative' as const,
    zIndex: 1,
  },
  '&[data-focus-visible]': {
    outline: '1px solid var(--outline-color)',
  },
}

const tabPanelCss = {
  backgroundColor: 'var(--tertiary-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: '0 var(--radius-lg) var(--radius-lg) var(--radius-lg)',
  padding: 'var(--space-4)',
}

export type TabsProps = ComponentProps<typeof RacTabs> & {
  css?: Interpolation<Theme>
}

export type TabListProps = ComponentProps<typeof RacTabList> & {
  css?: Interpolation<Theme>
}

export type TabProps = ComponentProps<typeof RacTab> & {
  css?: Interpolation<Theme>
}

export type TabPanelsProps = ComponentProps<typeof RacTabPanels> & {
  css?: Interpolation<Theme>
}

export type TabPanelProps = ComponentProps<typeof RacTabPanel> & {
  css?: Interpolation<Theme>
}

export function Tabs({ css: cssProp, ...props }: TabsProps) {
  return <RacTabs css={cssProp ? [tabsCss, cssProp] : tabsCss} {...props} />
}

export function TabList({ css: cssProp, ...props }: TabListProps) {
  return (
    <RacTabList css={cssProp ? [tabListCss, cssProp] : tabListCss} {...props} />
  )
}

export function Tab({ css: cssProp, ...props }: TabProps) {
  return <RacTab css={cssProp ? [tabCss, cssProp] : tabCss} {...props} />
}

export function TabPanels({ css: cssProp, ...props }: TabPanelsProps) {
  return (
    <RacTabPanels
      css={cssProp ? [tabPanelsCss, cssProp] : tabPanelsCss}
      {...props}
    />
  )
}

export function TabPanel({ css: cssProp, ...props }: TabPanelProps) {
  return (
    <RacTabPanel
      {...props}
      css={cssProp ? [tabPanelCss, cssProp] : tabPanelCss}
    />
  )
}
