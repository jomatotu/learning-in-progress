import { Link } from 'react-router'
import { ApplicationForm } from './ApplicationForm'
import { LookToggle } from '../look/LookToggle'

// The /application page: main's top bar and app shell around the application form.
export function ApplicationPage() {
  return (
    <main className="app-shell application-page">
      <header className="topbar">
        <h1 className="sr-only">Learning in Progress</h1>
        <Link to="/" className="brand" aria-label="Zurück zur Startseite">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span>learning in progress</span>
        </Link>
        <LookToggle />
      </header>
      <div className="mx-auto max-w-[75rem] px-4 py-4 md:px-6 md:py-2">
        <ApplicationForm />
      </div>
    </main>
  )
}
