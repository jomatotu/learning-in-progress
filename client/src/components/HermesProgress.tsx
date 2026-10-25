import { useEffect, useRef, useState } from 'react'
import { MorphLoader, type MorphStep } from '@/components/MorphLoader'
import { defineMessages, useMessages } from '@/lib/i18n'

const messages = defineMessages({
  en: {
    starting: 'Starting …',
    thinking: 'Hermes is thinking',
    watch: 'Watch Morph work',
    hide: 'Hide',
  },
  de: {
    starting: 'Wird gestartet …',
    thinking: 'Hermes denkt',
    watch: 'Morph bei der Arbeit zusehen',
    hide: 'Ausblenden',
  },
})

// Whether the student opened the raw view; kept for the browser session.
const WATCH_KEY = 'lip-watch-morph'

function loadWatching(): boolean {
  try {
    return sessionStorage.getItem(WATCH_KEY) === '1'
  } catch {
    return false
  }
}

function saveWatching(watching: boolean) {
  try {
    sessionStorage.setItem(WATCH_KEY, watching ? '1' : '0')
  } catch {
    // Storage blocked: the choice just isn't kept.
  }
}

type HermesProgressProps = {
  status: string
  reasoning: string
  // How far the build is; by default "reading" until Hermes reports its first step.
  step?: MorphStep
  // The morphing dot above the line; off where another wait animation is already on screen.
  shape?: boolean
}

// Students see Morph's wait state with one friendly line. A quiet button opens the raw view: Hermes's tool
// status, the elapsed time and its (English) reasoning.
export function HermesProgress({
  status,
  reasoning,
  step,
  shape = false,
}: HermesProgressProps) {
  const [watching, setWatching] = useState(loadWatching)
  // Here, not in the raw view, so the time counts from the start even when the view opens later.
  const [startedAt] = useState(() => Date.now())
  const t = useMessages(messages)

  function toggle() {
    saveWatching(!watching)
    setWatching(!watching)
  }

  return (
    <div className="flex flex-col gap-2">
      <MorphLoader step={step ?? (status ? 1 : 0)} shape={shape} />
      <button
        type="button"
        aria-expanded={watching}
        onClick={toggle}
        className="self-center rounded text-sm text-muted-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {watching ? t.hide : t.watch}
      </button>
      {watching && (
        <RawProgress
          status={status}
          reasoning={reasoning}
          startedAt={startedAt}
        />
      )}
    </div>
  )
}

// The current step, how long it has been running, and the latest reasoning in a box that scrolls along.
type RawProgressProps = {
  status: string
  reasoning: string
  startedAt: number
}

function RawProgress({ status, reasoning, startedAt }: RawProgressProps) {
  const box = useRef<HTMLPreElement>(null)
  const [now, setNow] = useState(() => Date.now())
  const t = useMessages(messages)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight
  }, [reasoning])

  return (
    <>
      <p className="flex gap-2 text-muted-foreground">
        <span aria-live="polite">{status || t.starting}</span>
        {/* Outside the live region, so screen readers don't announce every second. */}
        <span className="tabular-nums">{formatElapsed(now - startedAt)}</span>
      </p>
      {reasoning && (
        <pre
          ref={box}
          aria-label={t.thinking}
          className="max-h-48 overflow-y-auto rounded-lg border bg-muted/40 p-3 text-xs whitespace-pre-wrap text-muted-foreground"
        >
          {reasoning}
        </pre>
      )}
    </>
  )
}

// Formats milliseconds as m:ss, e.g. 83000 → "1:23".
export function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
