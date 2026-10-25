import { useEffect, useRef, useState } from 'react'

type HermesProgressProps = { status: string; reasoning: string }

// Shows what Hermes is doing: the current step, how long it has been running, and its latest reasoning
// in a small box that scrolls along as text arrives. The timer shows the request is alive even when Hermes is quiet.
export function HermesProgress({ status, reasoning }: HermesProgressProps) {
  const box = useRef<HTMLPreElement>(null)
  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(startedAt)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight
  }, [reasoning])

  return (
    <div className="flex flex-col gap-2">
      <p className="flex gap-2 text-muted-foreground">
        <span aria-live="polite">{status || 'Startet…'}</span>
        {/* Outside the live region, so screen readers don't announce every second. */}
        <span className="tabular-nums">{formatElapsed(now - startedAt)}</span>
      </p>
      {reasoning && (
        <pre
          ref={box}
          aria-label="Hermes denkt"
          className="max-h-48 overflow-y-auto rounded-lg border bg-muted/40 p-3 text-xs whitespace-pre-wrap text-muted-foreground"
        >
          {reasoning}
        </pre>
      )}
    </div>
  )
}

// Formats milliseconds as m:ss, e.g. 83000 → "1:23".
export function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
