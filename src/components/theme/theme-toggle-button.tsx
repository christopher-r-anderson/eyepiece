import { Switch } from 'react-aria-components'
import {
  MoonStarsIcon,
  SunIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from '@phosphor-icons/react/dist/ssr'
import { useThemeToggle } from './theme-provider'
import type { SwitchProps } from 'react-aria-components'

const ThemeToggleButton = (props: SwitchProps) => {
  const { theme, toggleTheme } = useThemeToggle()
  const isThemeSet = theme !== undefined
  return (
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
  )
}

export default ThemeToggleButton
