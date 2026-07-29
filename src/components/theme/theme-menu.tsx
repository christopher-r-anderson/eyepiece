import {
  CheckIcon,
  MonitorIcon,
  MoonStarsIcon,
  SunIcon,
} from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { useTheme } from './theme-provider'
import type { ThemeMode } from './theme-provider'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, MenuItem, MenuTrigger } from '@/components/ui/menus'
import { Popover } from '@/components/ui/popover'

const MODES: Array<{ id: ThemeMode; label: string; icon: ReactNode }> = [
  { id: 'light', label: 'Light', icon: <SunIcon aria-hidden="true" /> },
  { id: 'dark', label: 'Dark', icon: <MoonStarsIcon aria-hidden="true" /> },
  { id: 'system', label: 'System', icon: <MonitorIcon aria-hidden="true" /> },
]

export function ThemeMenu() {
  const { mode, setMode } = useTheme()
  return (
    <MenuTrigger>
      <Button
        aria-label="Theme"
        variant="bare"
        css={{
          // the nav chips share the compact control square
          width: 'controlHeightSm',
          height: 'controlHeightSm',
          display: 'inline-grid',
          placeItems: 'center',
          borderRadius: 'full',
          color: 'text.muted',
          transitionFast: 'color, background-color',
          _hovered: { color: 'text', backgroundColor: 'bg.surface.2' },
        }}
      >
        {/* the icon follows the html data-theme attribute in CSS, so the
            server markup never depends on client-only theme state */}
        <SunIcon
          size={20}
          aria-hidden="true"
          className={css({ _dark: { display: 'none' } })}
        />
        <MoonStarsIcon
          size={20}
          aria-hidden="true"
          className={css({ display: 'none', _dark: { display: 'block' } })}
        />
      </Button>
      <Popover placement="bottom end" containerPadding={20}>
        <Menu
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={mode ? [mode] : []}
          onSelectionChange={(keys) => {
            const selected = [...keys][0]
            if (
              selected === 'light' ||
              selected === 'dark' ||
              selected === 'system'
            ) {
              setMode(selected)
            }
          }}
        >
          {MODES.map(({ id, label, icon }) => (
            <MenuItem
              key={id}
              id={id}
              textValue={label}
              css={{
                display: 'flex',
                alignItems: 'center',
                gap: '2',
              }}
            >
              {({ isSelected }) => (
                <>
                  {icon}
                  {label}
                  <CheckIcon
                    aria-hidden="true"
                    className={css({
                      marginInlineStart: 'auto',
                      visibility: isSelected ? 'visible' : 'hidden',
                    })}
                  />
                </>
              )}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  )
}
