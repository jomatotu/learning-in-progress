import { Link, useParams } from 'react-router'
import { defineMessages, useMessages } from '@/lib/i18n'

const messages = defineMessages({
  en: {
    home: 'Back to the home page',
    frameTitle: 'Your learning page',
  },
  de: {
    home: 'Zur Startseite',
    frameTitle: 'Deine Lernseite',
  },
})

// Hermes-written pages run in a sandboxed frame (opaque origin, strict CSP),
// never in the app's own origin; sandbox.html loads the generated module.
export function SolutionRoute() {
  const { uuid = '' } = useParams()
  const t = useMessages(messages)
  return (
    <div className="flex h-screen flex-col">
      <Link to="/" className="px-4 py-2 text-sm underline">
        {t.home}
      </Link>
      <iframe
        title={t.frameTitle}
        sandbox="allow-scripts"
        src={`/sandbox.html?page=${encodeURIComponent(uuid)}`}
        className="block w-full flex-1 border-0"
      />
    </div>
  )
}
