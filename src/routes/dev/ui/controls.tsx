import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { css } from 'styled-system/css'
import { grid, wrap } from 'styled-system/patterns'
import {
  DevPanel,
  DevTitleBlock,
  devCardGridCss,
  devPageSectionCss,
} from '../-components'
import { Button } from '@/components/ui/button'
import { Form, FormActions, InputGroup, TextField } from '@/components/ui/forms'
import { SearchInput } from '@/features/search/components/search-bar/search-input'
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

  return (
    <div className={css(devPageSectionCss)}>
      <section className={grid({ gap: '4' })}>
        <DevTitleBlock
          title="Controls"
          description="Buttons, tabs, and form fields."
        />

        <div className={css(devCardGridCss)}>
          <DevPanel as="article" css={css.raw({ padding: '4' })}>
            <DevTitleBlock title="Buttons" headingLevel={3} />
            <div className={wrap({ gap: '3', align: 'center' })}>
              <Button>Secondary</Button>
              <Button variant="primary">Primary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="bare" icon={MagnifyingGlassIcon}>
                Bare
              </Button>
              <Button icon={MagnifyingGlassIcon}>Search</Button>
              <Button isDisabled>Disabled</Button>
            </div>
          </DevPanel>

          <DevPanel as="article" css={css.raw({ padding: '4' })}>
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

          <DevPanel as="article" css={css.raw({ padding: '4' })}>
            <DevTitleBlock title="Switches and Toggles" headingLevel={3} />
            <div className={wrap({ align: 'center', gap: '3' })}>
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

      <DevPanel css={css.raw({ padding: '4' })}>
        <DevTitleBlock
          title="Search Inputs"
          description="Search fields."
          headingLevel={3}
        />

        <div className={grid({ gap: '4' })}>
          <SearchInput
            aria-label="Search examples"
            value={searchValue}
            onChange={setSearchValue}
          />
        </div>
      </DevPanel>

      <DevPanel css={css.raw({ padding: '4' })}>
        <DevTitleBlock
          title="Form Fields"
          description="Current shared text field patterns."
          headingLevel={3}
        />
        <Form
          layout="page"
          controls={
            <FormActions>
              <Button type="submit">Submit</Button>
            </FormActions>
          }
        >
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
