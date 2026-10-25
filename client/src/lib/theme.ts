import { createContext, use } from 'react'

// Light or dark look for the whole site. The class "dark" on <html> switches it (see src/styles/theme.css).
export type Theme = 'light' | 'dark'

export const themeStorageKey = 'theme'

export const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({ theme: 'light', setTheme: () => {} })

export function useTheme() {
  return use(ThemeContext)
}

// The saved choice, or the device's setting if the student never picked one.
export function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(themeStorageKey)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Storage can be blocked; fall back to the device setting.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}
