import { Focus } from 'lucide-react'
import { defineMessages, useMessages } from '@/lib/i18n'
import { useFocus } from '@/lib/focus'

const messages = defineMessages({
  en: {
    on: 'Turn off focus mode',
    off: 'Turn on focus mode',
  },
  de: {
    on: 'Fokusmodus ausschalten',
    off: 'Fokusmodus einschalten',
  },
})

// Spotlight button for the top bar, next to the theme and language toggles.
// While on, only the block under the mouse stays bright (FocusOverlay).
export function FocusToggle() {
  const { focusMode, setFocusMode } = useFocus()
  const t = useMessages(messages)

  return (
    <button
      type="button"
      className="theme-toggle focus-toggle"
      aria-label={focusMode ? t.on : t.off}
      aria-pressed={focusMode}
      onClick={() => setFocusMode(!focusMode)}
    >
      <Focus size={16} aria-hidden />
    </button>
  )
}
