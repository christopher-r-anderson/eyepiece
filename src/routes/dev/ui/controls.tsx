import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
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
    <div css={{ display: 'grid', gap: 'var(--space-section-gap)' }}>
      <section css={{ display: 'grid', gap: 'var(--space-4)' }}>
        <div css={{ display: 'grid', gap: 'var(--space-2)' }}>
          <h2 css={{ margin: 0, fontSize: 'var(--text-xl)' }}>Controls</h2>
          <p css={{ margin: 0, maxWidth: 'var(--size-reading-max)' }}>
            Buttons, tabs, and form fields.
          </p>
        </div>

        <div
          css={{
            display: 'grid',
            alignItems: 'start',
            gap: 'var(--space-4)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
          }}
        >
          <article
            css={{
              display: 'grid',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <h3 css={{ margin: 0 }}>Buttons</h3>
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
          </article>

          <article
            css={{
              display: 'grid',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <h3 css={{ margin: 0 }}>Tabs</h3>
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
          </article>

          <article
            css={{
              display: 'grid',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <h3 css={{ margin: 0 }}>Switches and Toggles</h3>
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
          </article>
        </div>
      </section>

      <section
        css={{
          display: 'grid',
          gap: 'var(--space-4)',
          padding: 'var(--space-4)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div css={{ display: 'grid', gap: 'var(--space-2)' }}>
          <h3 css={{ margin: 0 }}>Search and Range Inputs</h3>
          <p css={{ margin: 0, maxWidth: 'var(--size-reading-max)' }}>
            Search fields and sliders.
          </p>
        </div>

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
      </section>

      <section
        css={{
          display: 'grid',
          gap: 'var(--space-4)',
          padding: 'var(--space-4)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div css={{ display: 'grid', gap: 'var(--space-2)' }}>
          <h3 css={{ margin: 0 }}>Form Fields</h3>
          <p css={{ margin: 0, maxWidth: 'var(--size-reading-max)' }}>
            Current shared text field patterns.
          </p>
        </div>
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
      </section>
    </div>
  )
}
