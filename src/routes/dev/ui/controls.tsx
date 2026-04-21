import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  DevPanel,
  DevTitleBlock,
  devCardGridCss,
  devPageSectionCss,
} from '../-components'
import { Button } from '@/components/ui/button'
import { Form, InputGroup, TextField } from '@/components/ui/forms'
import { SearchInput } from '@/features/search/components/search-bar/search-input'
import { YearRangeSlider } from '@/features/search/components/providers/nasa-ivl-filters/year-range-slider'
import { ToggleButton } from '@/components/ui/toggle-button'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

export const Route = createFileRoute('/dev/ui/controls')({
  component: DevUiControlsPage,
})

function DevUiControlsPage() {
  const [searchValue, setSearchValue] = useState('Crab Nebula')
  const [switchSelected, setSwitchSelected] = useState(false)
  const [toggleSelected, setToggleSelected] = useState(true)
  const [years, setYears] = useState<[number, number]>([1995, 2024])

  return (
    <div css={devPageSectionCss}>
      <section css={{ display: 'grid', gap: 'var(--space-4)' }}>
        <DevTitleBlock
          title="Controls"
          description="Buttons, tabs, and form fields."
        />

        <div css={devCardGridCss}>
          <DevPanel as="article" css={{ padding: 'var(--space-4)' }}>
            <DevTitleBlock title="Buttons" headingLevel={3} />
            <div
              css={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                alignItems: 'center',
              }}
            >
              <Button>Secondary</Button>
              <Button variant="primary">Primary</Button>
              <Button icon={MagnifyingGlassIcon}>Search</Button>
            </div>
          </DevPanel>

          <DevPanel as="article" css={{ padding: 'var(--space-4)' }}>
            <DevTitleBlock title="Tabs" headingLevel={3} />
            <Tabs defaultSelectedKey="overview">
              <TabList aria-label="UI workbench tabs">
                <Tab id="overview">Overview</Tab>
                <Tab id="states">States</Tab>
                <Tab id="notes">Notes</Tab>
              </TabList>
              <TabPanels>
                <TabPanel id="overview">Current tab styling.</TabPanel>
                <TabPanel id="states">Interactive states.</TabPanel>
                <TabPanel id="notes">Parent tab primitives.</TabPanel>
              </TabPanels>
            </Tabs>
          </DevPanel>

          <DevPanel as="article" css={{ padding: 'var(--space-4)' }}>
            <DevTitleBlock title="Switches and Toggles" headingLevel={3} />
            <div
              css={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
              }}
            >
              <Switch
                aria-label="Example switch"
                isSelected={switchSelected}
                onChange={setSwitchSelected}
              >
                {switchSelected ? 'On' : 'Off'}
              </Switch>
              <ToggleButton
                aria-label="Example toggle button"
                isSelected={toggleSelected}
                onChange={setToggleSelected}
              >
                {toggleSelected ? 'Selected' : 'Idle'}
              </ToggleButton>
            </div>
          </DevPanel>
        </div>
      </section>

      <DevPanel css={{ padding: 'var(--space-4)' }}>
        <DevTitleBlock
          title="Search and Range Inputs"
          description="Search fields and sliders."
          headingLevel={3}
        />

        <div css={{ display: 'grid', gap: 'var(--space-4)' }}>
          <SearchInput
            aria-label="Search examples"
            value={searchValue}
            onChange={setSearchValue}
          />

          <YearRangeSlider
            aria-label="Example year range"
            value={years}
            minValue={1900}
            maxValue={2025}
            onChange={(newYears) => {
              if (Array.isArray(newYears) && newYears.length === 2) {
                setYears([newYears[0], newYears[1]])
              }
            }}
          />
        </div>
      </DevPanel>

      <DevPanel css={{ padding: 'var(--space-4)' }}>
        <DevTitleBlock
          title="Form Fields"
          description="Current shared text field patterns."
          headingLevel={3}
        />
        <Form controls={<Button type="submit">Submit</Button>}>
          <InputGroup>
            <TextField
              label="Email"
              name="email"
              type="email"
              placeholder="astronomer@example.com"
              description="Email input pattern."
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              description="Password input pattern."
            />
          </InputGroup>
        </Form>
      </DevPanel>
    </div>
  )
}
