import {
  MoonStarsIcon,
  SunIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
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
      className={css({
        display: 'inline-flex',
        width: 'fit-content',
        flex: 'none',
        fontSize: 'base',
        padding: 0,
        margin: 0,
      })}
    >
      <div
        className={css({
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2',
          transitionProperty: 'opacity',
          transitionDuration: 'base',
          transitionTimingFunction: 'default',
        })}
        style={{ opacity: isThemeSet ? 1 : 0.3 }}
        aria-hidden={!isThemeSet}
      >
        <SunIcon className={css({ color: 'text.muted' })} />
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
        <MoonStarsIcon className={css({ color: 'text.muted' })} />
      </div>
    </form>
  )
}

export default ThemeSwitch
