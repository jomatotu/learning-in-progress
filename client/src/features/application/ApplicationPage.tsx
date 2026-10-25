import { Link } from 'react-router'
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
          <ThemeToggle />
          <LookToggle />
        </div>
      </header>
      <div className="flex flex-1 flex-col">
        <ApplicationForm />
      </div>
    </main>
  )
}
