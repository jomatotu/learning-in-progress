import { Moon, Sun } from 'lucide-react'
import { defineMessages, useMessages } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'

const messages = defineMessages({
  en: { toDark: 'Switch to dark mode', toLight: 'Switch to light mode' },
  de: {
    toDark: 'Zum dunklen Modus wechseln',
    toLight: 'Zum hellen Modus wechseln',
  },
})

// Sun / moon button for the top bar. Same size and border as main's round help button.
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const t = useMessages(messages)
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={dark ? t.toLight : t.toDark}
      aria-pressed={dark}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </button>
  )
}
