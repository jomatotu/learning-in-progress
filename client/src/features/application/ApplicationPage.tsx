import { Link } from 'react-router'
import { ApplicationForm } from './ApplicationForm'
import { ReadingComfort } from './ReadingComfort'

// The /application page: main's top bar and app shell around the application form.
export function ApplicationPage() {
  return (
    <main className="app-shell application-page">
      <header className="topbar">
        <h1 className="sr-only">Learning in Progress</h1>
        <Link to="/" className="brand" aria-label="Back to the home page">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span>learning in progress</span>
        </Link>
        <ReadingComfort />
      </header>
      <div className="mx-auto max-w-[1120px] px-4 py-10 md:px-6 md:py-14">
        <ApplicationForm />
      </div>
    </main>
  )
}
