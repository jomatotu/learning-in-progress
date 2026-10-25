import {
  Component,
  Suspense,
  lazy,
  useMemo,
  type ComponentType,
  type ReactNode,
} from 'react'
import { TUTOR } from '@/lib/tutor'

type Loader = () => Promise<unknown>

function Card({
  kicker,
  title,
  text,
}: {
  kicker: string
  title: string
  text: string
}) {
  return (
    <div className="mx-auto max-w-[1120px] px-4 py-10 md:px-6 md:py-14">
      <div className="rounded-[20px] border border-rule bg-sheet p-8 shadow-card md:p-14">
        <span className="kicker">{kicker}</span>
        <h2 className="mt-3 text-[2rem]">{title}</h2>
        <p className="mt-4 max-w-[46ch] text-graphite">{text}</p>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <Card
      kicker="Nicht gefunden"
      title="Diese Seite gibt es nicht (mehr)."
      text={`Lass ${TUTOR} eine neue Seite für dich bauen.`}
    />
  )
}

// Shown when sandbox.html is opened directly instead of inside the sandboxed frame.
export function EmbeddedOnly() {
  return (
    <Card
      kicker="Nur eingebettet"
      title="Diese Seite läuft nur eingebettet."
      text="Öffne sie über deine Lernseite."
    />
  )
}

// A generated page that throws (or fails to load) shows a card instead of a blank frame.
class PageErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  override render() {
    return this.state.failed ? (
      <Card
        kicker="Fehler"
        title={`Diese Seite hat einen Fehler. Lass ${TUTOR} sie neu bauen.`}
        text="Deine Daten sind nicht verloren."
      />
    ) : (
      this.props.children
    )
  }
}

// A module without a default-export function falls back to the not-found card.
function isComponent(value: unknown): value is ComponentType {
  return typeof value === 'function'
}

async function toComponent(load: Loader): Promise<{ default: ComponentType }> {
  const loaded = await load()
  const component =
    typeof loaded === 'object' && loaded !== null && 'default' in loaded
      ? loaded.default
      : undefined
  return { default: isComponent(component) ? component : NotFound }
}

// Runs inside the sandboxed frame (opaque origin, no /api access).
export function SandboxPage({ load }: { load: Loader | undefined }) {
  const Page = useMemo(
    () => (load ? lazy(() => toComponent(load)) : NotFound),
    [load],
  )
  return (
    <div className="app-shell application-page">
      <PageErrorBoundary>
        <Suspense
          fallback={<p className="p-8 text-graphite">Seite wird geladen …</p>}
        >
          {/* Page is memoized per loader above, so it keeps its state across renders. */}
          {/* oxlint-disable-next-line react/static-components */}
          <Page />
        </Suspense>
      </PageErrorBoundary>
    </div>
  )
}
