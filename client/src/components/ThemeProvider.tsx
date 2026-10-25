import { useEffect, useState, type ReactNode } from 'react'
import {
  applyTheme,
  initialTheme,
  ThemeContext,
  themeStorageKey,
  type Theme,
} from '@/lib/theme'

// Holds the light/dark choice for the whole site and remembers it between visits.
export function ThemeProvider({
  initial,
  children,
}: {
  initial?: Theme
  children: ReactNode
}) {
  const [theme, setTheme] = useState<Theme>(() => initial ?? initialTheme())

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(themeStorageKey, theme)
    } catch {
      // Storage can be blocked; the choice still applies until the page reloads.
    }
  }, [theme])

  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>
}
