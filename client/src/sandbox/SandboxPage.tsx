import { Suspense, lazy, useMemo, type ComponentType } from 'react'

type Loader = () => Promise<unknown>

function NotFound() {
  return (
    <div className="mx-auto max-w-[1120px] px-4 py-10 md:px-6 md:py-14">
      <div className="rounded-[20px] border border-rule bg-sheet p-8 shadow-card md:p-14">
        <span className="kicker">Nicht gefunden</span>
        <h2 className="mt-3 text-[2rem]">Diese Seite gibt es nicht (mehr).</h2>
        <p className="mt-4 max-w-[46ch] text-graphite">
          Lass Hermes eine neue Seite für dich bauen.
        </p>
      </div>
    </div>
  )
}

// A module without a default-export function falls back to the not-found card.
async function toComponent(load: Loader): Promise<{ default: ComponentType }> {
  const component = ((await load()) as { default?: unknown }).default
  return {
    default:
      typeof component === 'function' ? (component as ComponentType) : NotFound,
  }
}

// Runs inside the sandboxed frame (opaque origin, no /api access).
export function SandboxPage({ load }: { load: Loader | undefined }) {
  const Page = useMemo(
    () => (load ? lazy(() => toComponent(load)) : NotFound),
    [load],
  )
  return (
    <Suspense fallback={null}>
      <div className="app-shell application-page">
        <Page />
      </div>
    </Suspense>
  )
}
