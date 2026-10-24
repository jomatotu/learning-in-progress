import { useParams } from 'react-router'

// Hermes-written pages run in a sandboxed frame (opaque origin, strict CSP),
// never in the app's own origin; sandbox.html loads the generated module.
export function SolutionRoute() {
  const { uuid = '' } = useParams()
  return (
    <iframe
      title="Deine Lernseite"
      sandbox="allow-scripts"
      src={`/sandbox.html?page=${encodeURIComponent(uuid)}`}
      className="block h-screen w-full border-0"
    />
  )
}
