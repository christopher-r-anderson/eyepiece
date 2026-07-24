import { createContext, useContext, useEffect, useState } from 'react'
import { ScriptOnce } from '@tanstack/react-router'
import type { ReactNode } from 'react'

const THEME_STORAGE_KEY = 'theme-mode'
const THEME_ATTR_NAME = 'data-theme'

export type ThemeMode = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  // undefined until the client reads the stored mode (pre-hydration)
  mode: ThemeMode | undefined
  resolvedTheme: ResolvedTheme | undefined
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType>({
  mode: undefined,
  resolvedTheme: undefined,
  setMode: () => {},
})

export const useTheme = () => useContext(ThemeContext)

function systemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? systemTheme() : mode
}

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setModeState] = useState<ThemeMode | undefined>()
  const [resolvedTheme, setResolvedTheme] = useState<
    ResolvedTheme | undefined
  >()

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    const initialMode =
      stored === 'light' || stored === 'dark' ? stored : 'system'
    setModeState(initialMode)
    const docTheme = document.documentElement.getAttribute(THEME_ATTR_NAME)
    setResolvedTheme(docTheme === 'dark' ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    if (resolvedTheme) {
      document.documentElement.setAttribute(THEME_ATTR_NAME, resolvedTheme)
    }
  }, [resolvedTheme])

  useEffect(() => {
    if (mode !== 'system') {
      return
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolvedTheme(systemTheme())
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [mode])

  const setMode = (newMode: ThemeMode) => {
    if (newMode === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY)
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, newMode)
    }
    setModeState(newMode)
    setResolvedTheme(resolveTheme(newMode))
  }

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      <ScriptOnce>{THEME_SCRIPT}</ScriptOnce>
      {children}
    </ThemeContext.Provider>
  )
}

const THEME_SCRIPT = `(function() {
  try {
    const mode = localStorage.getItem('${THEME_STORAGE_KEY}') || 'system'
    let theme
    if (mode === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme = isSystemDark ? 'dark' : 'light'
    } else {
      theme = mode
    }
    document.documentElement.setAttribute('${THEME_ATTR_NAME}', theme)
  } catch {
    document.documentElement.setAttribute('${THEME_ATTR_NAME}', 'light')
  }
})();`
