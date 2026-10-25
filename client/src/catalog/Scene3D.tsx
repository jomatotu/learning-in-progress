// A rotatable 3D model from simple shapes. The WebGL canvas loads on demand, so three.js stays out of the
// main bundle; the part buttons below it work without WebGL and from the keyboard.
import { lazy, Suspense, useState } from 'react'
import { Card, Original, SafeBlock } from './blocks'

const SceneCanvas = lazy(() => import('./SceneCanvas'))

export interface ScenePart {
  label?: string
  shape?: 'sphere' | 'box' | 'cylinder' | 'torus'
  position?: number[]
  size?: number
  color?: string
  text?: string
}

// No auto-rotation for students who asked for less motion, or in the still Graustufen look.
function prefersStill() {
  return (
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
      false) ||
    document.documentElement.dataset.look === 'graustufen'
  )
}

export function Scene3D({
  title,
  parts = [],
  source,
}: {
  title?: string
  parts?: ScenePart[]
  source?: string
}) {
  const [selected, setSelected] = useState<number | null>(null)
  return (
    <Card>
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="mt-4 h-72 overflow-hidden rounded-xl bg-pine-soft">
        <SafeBlock>
          <Suspense
            fallback={
              <p className="grid h-full place-items-center text-graphite">
                3D-Modell lädt…
              </p>
            }
          >
            <SceneCanvas
              parts={parts}
              selected={selected}
              onSelect={setSelected}
              autoRotate={!prefersStill()}
            />
          </Suspense>
        </SafeBlock>
      </div>
      <p className="mt-2 text-sm text-graphite">
        Zum Drehen ziehen. Tippe auf ein Teil.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {parts.map((part, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 ring-1 ring-rule transition-colors hover:bg-pine-soft focus-visible:ring-2 focus-visible:ring-pine focus-visible:outline-none ${
              selected === i ? 'bg-pine-soft font-semibold' : ''
            }`}
          >
            <span
              aria-hidden
              className="size-3 rounded-full"
              style={{ background: part.color }}
            />
            {part.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-4 text-lg">
        {selected !== null && parts[selected]?.text}
      </p>
      <Original source={source} />
    </Card>
  )
}
