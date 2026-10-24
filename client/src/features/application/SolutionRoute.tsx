import { Link, useParams } from 'react-router'

// Hermes-written pages run in a sandboxed frame (opaque origin, strict CSP),
// never in the app's own origin; sandbox.html loads the generated module.
export function SolutionRoute() {
  const { uuid = '' } = useParams()
  return (
    <div className="flex h-screen flex-col">
      <Link to="/" className="px-4 py-2 text-sm underline">
        Zur Startseite
      </Link>
      <iframe
        title="Deine Lernseite"
        sandbox="allow-scripts"
        src={`/sandbox.html?page=${encodeURIComponent(uuid)}`}
        className="block w-full flex-1 border-0"
      />
    </div>
  )
}
