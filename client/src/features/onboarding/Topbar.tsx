import { LanguageToggle } from '@/components/LanguageToggle'
import { ThemeToggle } from '@/components/ThemeToggle'
import { defineMessages, useMessages } from '@/lib/i18n'
import { LookToggle } from '../look/LookToggle'

type TopbarProps = {
  step: number
  onHome: () => void
}

const messages = defineMessages({
  de: {
    home: 'Zur Startseite',
    step: (n: number) => `Schritt ${n} von 6`,
    help: 'Hilfe',
  },
  en: {
    home: 'Back to the home page',
    step: (n: number) => `Step ${n} of 6`,
    help: 'Help',
  },
})

export function Topbar({ step, onHome }: TopbarProps) {
  const progress = Math.max(0, Math.min(100, (step / 5) * 100))
  const t = useMessages(messages)

  return (
    <header className="topbar">
      <button className="brand" onClick={onHome} aria-label={t.home}>
        <span className="brand-mark">
          <span />
          <span />
          <span />
        </span>
        <span>morph</span>
      </button>
      {step > 0 && (
        <div className="stepper" aria-label={t.step(step + 1)}>
          <span className="step-label">{t.step(step + 1)}</span>
          <span className="progress">
            <i style={{ width: `${progress}%` }} />
          </span>
        </div>
      )}
      <div className="topbar-actions">
        <LanguageToggle />
        <ThemeToggle />
        <LookToggle />
        <button className="help" aria-label={t.help}>
          ?
        </button>
      </div>
    </header>
  )
}
