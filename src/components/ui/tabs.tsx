import { Tab as RacTab, TabPanel as RacTabPanel } from 'react-aria-components'
import type { TabPanelProps, TabProps } from 'react-aria-components'

export { TabList, TabPanels, Tabs } from 'react-aria-components'

const tabCss = {
  padding: '0.5rem 1rem',
  border: '1px solid var(--border-color)',
  borderBottom: 'none',
  backgroundColor: 'var(--secondary-bg)',
  color: 'var(--secondary-text)',
  display: 'inline-block',
  cursor: 'pointer',
  '&[data-current="true"],&[data-selected="true"]': {
    fontWeight: 'bold',
    backgroundColor: 'var(--tertiary-bg)',
  },
}

export function Tab(props: TabProps) {
  return <RacTab css={tabCss} {...props} />
}

export function TabPanel(props: TabPanelProps) {
  return (
    <RacTabPanel
      {...props}
      css={{
        backgroundColor: 'var(--tertiary-bg)',
        padding: '1rem',
      }}
    />
  )
}
