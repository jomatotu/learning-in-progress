import { Link, useSearchParams } from 'react-router'
import { demoProfile } from '@/features/demo/personas'
import { FocusToggle } from '@/components/FocusToggle'
import { LanguageToggle } from '@/components/LanguageToggle'
import { ThemeToggle } from '@/components/ThemeToggle'
import { defineMessages, useMessages } from '@/lib/i18n'
import { ApplicationForm } from './ApplicationForm'
import { LookToggle } from '../look/LookToggle'

const messages = defineMessages({
  en: { home: 'Back to the home page' },
  de: { home: 'Zur Startseite' },
})

// The /application page: main's top bar and app shell around the application form.
export function ApplicationPage() {
  const t = useMessages(messages)
  const [params] = useSearchParams()

  return (
    <main className="app-shell application-page flex min-h-dvh flex-col">
      <header className="topbar">
        <h1 className="sr-only">Morph</h1>
        <Link to="/" className="brand" aria-label={t.home}>
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span>morph</span>
        </Link>
        <div className="topbar-actions">
          <LanguageToggle />
          <FocusToggle />
          <ThemeToggle />
          <LookToggle />
        </div>
      </header>
      <div className="journey">
        <ApplicationForm seed={demoProfile(params.get('demo'))} />
      </div>
    </main>
  )
}
