import { MagnifyingGlassIcon, StarIcon } from '@phosphor-icons/react/dist/ssr'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { css } from 'styled-system/css'
import { grid, wrap } from 'styled-system/patterns'
import {
  DevBackLink,
  DevPageIntro,
  DevPanel,
  DevTitleBlock,
  devPageSectionCss,
} from '../-components'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormActions,
  FormHeading,
  InputGroup,
  TextField,
} from '@/components/ui/forms'
import { Heading } from '@/components/ui/heading'
import { Link } from '@/components/ui/link'
import { Menu, MenuItem, MenuTrigger } from '@/components/ui/menus'
import { ModalDialog } from '@/components/ui/modal-dialog'
import { Popover } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Sheet } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@/components/ui/tabs'
import { ToggleButton } from '@/components/ui/toggle-button'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { EmptyState } from '@/components/empty-state'
import { LoadingNotice } from '@/components/loading-notice'
import { PrettyException } from '@/components/errors/pretty-exception'
import { SearchInput } from '@/features/search/components/search-bar/search-input'

export const Route = createFileRoute('/dev/ui/')({
  component: DevUiGalleryPage,
})

const exampleException = new Error('The provider returned status 500', {
  cause: new Error('upstream request timed out'),
})

function DevUiGalleryPage() {
  const [searchValue, setSearchValue] = useState('Crab Nebula')
  const [switchSelected, setSwitchSelected] = useState(false)
  const [toggleSelected, setToggleSelected] = useState(true)
  const [textToggleSelected, setTextToggleSelected] = useState(false)
  const [iconToggleSelected, setIconToggleSelected] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const queueToast = useQueueToastMessage()

  return (
    <div className={css(devPageSectionCss)}>
      <DevPageIntro
        title="UI gallery"
        description="Shared components and their variants, rendered with the production styles."
        backLink={<DevBackLink to="/dev">Back to dev</DevBackLink>}
      />

      <DevPanel>
        <DevTitleBlock
          title="Headings"
          description="Levels set the document outline; size decouples the visual scale from the level."
        />
        <div className={grid({ gap: '3' })}>
          <Heading level={1}>Level 1</Heading>
          <Heading level={2}>Level 2</Heading>
          <Heading level={3}>Level 3</Heading>
          <Heading level={2} size="display-md">
            Level 2, display-md
          </Heading>
          <Heading level={2} size="title-lg">
            Level 2, title-lg
          </Heading>
          <Heading level={2} size="title-md">
            Level 2, title-md
          </Heading>
        </div>
      </DevPanel>

      <DevPanel>
        <DevTitleBlock
          title="Text styles"
          description="The fluid display ladder, the title ladder, and the mono meta voice (callers add lowercase/muted)."
        />
        <div className={grid({ gap: '3' })}>
          <p className={css({ textStyle: 'display.lg' })}>display.lg</p>
          <p className={css({ textStyle: 'display.md' })}>display.md</p>
          <p className={css({ textStyle: 'display.sm' })}>display.sm</p>
          <p className={css({ textStyle: 'title.lg' })}>title.lg</p>
          <p className={css({ textStyle: 'title.md' })}>title.md</p>
          <p className={css({ textStyle: 'title.sm' })}>title.sm</p>
          <p className={css({ textStyle: 'meta' })}>meta</p>
        </div>
      </DevPanel>

      <DevPanel>
        <DevTitleBlock title="Buttons" />
        <div className={wrap({ gap: '3', align: 'center' })}>
          <Button variant="primary">Primary</Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="text">Text</Button>
          <Button variant="icon" aria-label="Icon example">
            <MagnifyingGlassIcon aria-hidden="true" size={20} />
          </Button>
          <Button variant="bare" icon={MagnifyingGlassIcon}>
            Bare
          </Button>
          <Button icon={MagnifyingGlassIcon}>With icon</Button>
          <Button isDisabled>Disabled</Button>
          <Button variant="primary" isPending>
            Pending
          </Button>
        </div>
      </DevPanel>

      <DevPanel>
        <DevTitleBlock title="Links" />
        <div className={wrap({ gap: '4', align: 'center' })}>
          <Link to=".">Default</Link>
          <Link to="." variant="underline">
            Underline
          </Link>
          <Link to="." variant="ghost">
            Ghost
          </Link>
        </div>
      </DevPanel>

      <DevPanel>
        <DevTitleBlock
          title="Form fields"
          description="A described field and a password field with its visibility toggle."
        />
        <Form
          // demo-only: a native submit would put the field values in the URL
          onSubmit={(event) => event.preventDefault()}
          controls={
            <FormActions>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </FormActions>
          }
        >
          <FormHeading level={3}>Example form</FormHeading>
          <InputGroup>
            <TextField
              label="Email"
              name="email"
              type="email"
              placeholder="astronomer@example.com"
              description="A described field."
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
            />
          </InputGroup>
        </Form>
      </DevPanel>

      <DevPanel>
        <DevTitleBlock
          title="Panel form"
          description="The panel surface variant used by the auth card."
        />
        <Form
          surface="panel"
          onSubmit={(event) => event.preventDefault()}
          controls={
            <FormActions>
              <Button variant="primary" type="submit">
                Log in
              </Button>
            </FormActions>
          }
        >
          <FormHeading level={2}>Panel surface</FormHeading>
          <InputGroup>
            <TextField
              label="Email"
              name="panel-email"
              type="email"
              placeholder="astronomer@example.com"
            />
          </InputGroup>
        </Form>
      </DevPanel>

      <DevPanel>
        <DevTitleBlock title="Search field" />
        <SearchInput
          aria-label="Search example"
          value={searchValue}
          onChange={setSearchValue}
        />
      </DevPanel>

      <DevPanel>
        <DevTitleBlock title="Switches and toggles" />
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
          <ToggleButton
            aria-label={textToggleSelected ? 'Starred' : 'Star'}
            variant="text"
            isSelected={textToggleSelected}
            onChange={setTextToggleSelected}
          >
            <StarIcon
              aria-hidden="true"
              size={20}
              weight={textToggleSelected ? 'fill' : 'regular'}
            />
            {textToggleSelected ? 'starred' : 'star'}
          </ToggleButton>
          <ToggleButton
            aria-label="Star"
            variant="icon"
            isSelected={iconToggleSelected}
            onChange={setIconToggleSelected}
          >
            <StarIcon
              aria-hidden="true"
              size={20}
              weight={iconToggleSelected ? 'fill' : 'regular'}
            />
          </ToggleButton>
        </div>
      </DevPanel>

      <DevPanel>
        <DevTitleBlock title="Tabs" />
        <Tabs defaultSelectedKey="one">
          <TabList aria-label="Example tabs">
            <Tab id="one">First</Tab>
            <Tab id="two">Second</Tab>
            <Tab id="three">Third</Tab>
          </TabList>
          <TabPanels>
            <TabPanel id="one">The first panel.</TabPanel>
            <TabPanel id="two">The second panel.</TabPanel>
            <TabPanel id="three">The third panel.</TabPanel>
          </TabPanels>
        </Tabs>
      </DevPanel>

      <DevPanel>
        <DevTitleBlock
          title="Menu"
          description="Trigger, popover, items, and a separator."
        />
        <div className={wrap({ align: 'center', gap: '3' })}>
          <MenuTrigger>
            <Button>Open menu</Button>
            <Popover placement="bottom start">
              <Menu aria-label="Example menu">
                <MenuItem>First action</MenuItem>
                <MenuItem>Second action</MenuItem>
                <Separator />
                <MenuItem>After the separator</MenuItem>
              </Menu>
            </Popover>
          </MenuTrigger>
        </div>
      </DevPanel>

      <DevPanel>
        <DevTitleBlock
          title="Overlays"
          description="Modal dialog, sheet, and toast."
        />
        <div className={wrap({ align: 'center', gap: '3' })}>
          <Button onPress={() => setIsModalOpen(true)}>Open modal</Button>
          <Button onPress={() => setIsSheetOpen(true)}>Open sheet</Button>
          <Button
            variant="primary"
            onPress={() =>
              queueToast({
                title: 'Toast preview',
                description: 'Content length and spacing check.',
              })
            }
          >
            Queue toast
          </Button>
        </div>
      </DevPanel>

      <DevPanel>
        <DevTitleBlock
          title="States"
          description="Loading notice, empty state, and the error panel."
        />
        <div className={grid({ gap: '5' })}>
          <LoadingNotice>Loading examples…</LoadingNotice>
          <EmptyState>Nothing here yet. Try a different search.</EmptyState>
          <PrettyException error={exampleException} headingLevel={3} />
        </div>
      </DevPanel>

      <ModalDialog
        title="Example modal"
        isDismissable
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      >
        <div className={grid({ gap: '3' })}>
          <p>Modal spacing, close control, and responsive constraints.</p>
          <Button onPress={() => setIsModalOpen(false)}>Close</Button>
        </div>
      </ModalDialog>

      <Sheet
        aria-label="Example sheet"
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      >
        <p>Sheet content with the close control in the top corner.</p>
      </Sheet>
    </div>
  )
}
