import {
  MoonStarsIcon,
  SunIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from '@phosphor-icons/react/dist/ssr'
import { useThemeToggle } from './theme-provider'
import type { SwitchProps } from '@/components/ui/switch'
import { Switch } from '@/components/ui/switch'

const ThemeSwitch = (props: SwitchProps) => {
  const { theme, toggleTheme } = useThemeToggle()
  const isThemeSet = theme !== undefined
  // autocomplete explicitly off to avoid hydration mismatch issues in firefox
  // https://bugzilla.mozilla.org/show_bug.cgi?id=654072#c4
  return (
    <form
      autoComplete="off"
      css={{
        display: 'inline-flex',
        width: 'fit-content',
        flex: 'none',
        fontSize: 'var(--text-base)',
        padding: 0,
        margin: 0,
      }}
    >
      <div
        css={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
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
          isSelected={theme === 'dark'}
          isDisabled={!isThemeSet}
          variant="subtle"
        >
          {theme === 'dark' ? <ToggleRightIcon /> : <ToggleLeftIcon />}
        </Switch>
        <MoonStarsIcon color="var(--text-muted)" />
      </div>
    </form>
  )
}

export default ThemeSwitch
