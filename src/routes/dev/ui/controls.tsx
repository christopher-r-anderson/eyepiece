import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Form, InputGroup, TextField } from '@/components/ui/forms'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@/components/ui/tabs'

export const Route = createFileRoute('/dev/ui/controls')({
  component: DevUiControlsPage,
})

function DevUiControlsPage() {
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
