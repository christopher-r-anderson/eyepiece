import {
  MoonStarsIcon,
  SunIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from '@phosphor-icons/react/dist/ssr'
import { Form } from '../ui/forms'
import { useThemeToggle } from './theme-provider'
import type { SwitchProps } from '@/components/ui/switch'
import { Switch } from '@/components/ui/switch'

const ThemeToggleButton = (props: SwitchProps) => {
  const { theme, toggleTheme } = useThemeToggle()
  const isThemeSet = theme !== undefined
  // autocomplete explicitly off to avoid hydration mismatch issues in firefox
  // https://bugzilla.mozilla.org/show_bug.cgi?id=654072#c4
  return (
    <Form autoComplete="off">
      <div
        css={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'opacity 0.3s ease',
        }}
        style={{ opacity: isThemeSet ? 1 : 0.3 }}
        aria-hidden={!isThemeSet}
      >
        <SunIcon color="var(--text-muted)" />
        <Switch
          aria-label="Toggle Light and Dark Mode"
          {...props}
          onChange={toggleTheme}
          css={{
            display: 'inline-flex',
            alignItems: 'center',
          }}
          isSelected={theme === 'dark'}
          isDisabled={!isThemeSet}
        >
          {theme === 'dark' ? <ToggleRightIcon /> : <ToggleLeftIcon />}
        </Switch>
        <MoonStarsIcon color="var(--text-muted)" />
      </div>
    </Form>
  )
}

export default ThemeToggleButton
