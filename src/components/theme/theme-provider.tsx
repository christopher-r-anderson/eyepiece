import { createContext, useContext, useEffect, useState } from 'react'
import { ScriptOnce } from '@tanstack/react-router'
import type { ReactNode } from 'react'

const THEME_STORAGE_KEY = 'theme-mode'
const THEME_ATTR_NAME = 'data-theme'

interface ThemeToggleContextType {
  toggleTheme: () => void
  theme: 'light' | 'dark' | undefined
}

const ThemeToggleContext = createContext<ThemeToggleContextType>({
  toggleTheme: () => {},
  theme: undefined,
})

export const useThemeToggle = () => useContext(ThemeToggleContext)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<'light' | 'dark' | undefined>()
  useEffect(() => {
    const docTheme = document.documentElement.getAttribute(THEME_ATTR_NAME)
    if (docTheme === 'light' || docTheme === 'dark') {
      setTheme(docTheme)
    }
  }, [])
  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute(THEME_ATTR_NAME, theme)
    }
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    window.localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    setTheme(newTheme)
  }

  return (
    <ThemeToggleContext.Provider value={{ toggleTheme, theme }}>
      <ScriptOnce>{THEME_SCRIPT}</ScriptOnce>
      {children}
    </ThemeToggleContext.Provider>
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
  } catch (e) {
    console.warn('Theme script failed', e)
  }
})();`
