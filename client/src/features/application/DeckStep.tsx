import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { DeckEntry } from '@/lib/survey'
import { StepHeading } from './StepHeading'
import {
  answerBands,
  nextDeckState,
  type Band,
  type DeckAnswer,
  type DeckState,
} from './deck'

// Fields and buttons handle keys themselves; a shortcut there would answer twice or eat typing.
function keepsKey(key: string, target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.closest('input, textarea, select, [contenteditable]')) return true
  return key === 'Enter' && !!target.closest('button, a')
}

// One yes/no card per screen: what the band would mean for the student, and why. "Eher nicht" on the
// first card shows the opposite card, so a category takes one or two cards.
function DeckStep({
  deck,
  bands,
  onBands,
  onDone,
  onSurvey,
  onBack,
}: {
  deck: DeckEntry[]
  bands: Record<string, Band>
  onBands: (bands: Record<string, Band>) => void
  onDone: () => void
  onSurvey: () => void
  onBack: () => void
}) {
  const [state, setState] = useState<DeckState>({
    index: 0,
    asked: 'low',
    bands,
  })
  // What each earlier card looked like, so "Zurück" can take an answer back.
  const [history, setHistory] = useState<DeckState[]>([])

  const answer = (choice: DeckAnswer) => {
    onBands(answerBands(state, choice, deck))
    const next = nextDeckState(state, choice, deck)
    if (next === 'done') return onDone()
    setHistory((h) => [...h, state])
    setState(next)
  }

  const back = () => {
    const previous = history[history.length - 1]
    if (!previous) return onBack()
    onBands(previous.bands)
    setHistory(history.slice(0, -1))
    setState(previous)
  }

  // The key handler always calls the latest answer().
  const latest = useRef(answer)
  useEffect(() => {
    latest.current = answer
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key !== 'Enter' && e.key !== 'Backspace') return
      if (keepsKey(e.key, e.target)) return
      e.preventDefault()
      latest.current(e.key === 'Enter' ? 'stimmt' : 'eher_nicht')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const entry = deck[state.index]
  const card = entry[state.asked]
  const shown = history.length
  const extra = [...history, state].filter((s) => s.asked === 'high').length
  const total = deck.length + extra
  const isLast = state.index === deck.length - 1

  return (
    <div>
      <StepHeading
        label={`Wie du lernst · ${entry.title}`}
        hint="Eine kurze Frage pro Karte. Du kannst alles später ändern."
      >
        Stimmt das <em>für dich?</em>
      </StepHeading>

      <div className="mb-3 flex flex-wrap justify-between gap-x-4 text-sm text-graphite">
        <span>
          Karte {shown + 1} von etwa {total}
        </span>
      </div>

      <div aria-live="polite">
        <div className="rounded-[18px] bg-ink p-6 text-white">
          <span className="mb-2 block text-[0.7rem] font-bold tracking-[0.04em] text-[#bcb0f2]">
            Das heißt für dich
          </span>
          <p className="text-[1.2rem] leading-snug font-semibold [overflow-wrap:anywhere]">
            {card.text}
          </p>
        </div>
        <p className="mx-0.5 mt-3 mb-6 text-sm [overflow-wrap:anywhere] text-graphite">
          {card.reason}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="secondary-button justify-center py-3.5"
          onClick={() => answer('eher_nicht')}
        >
          Eher nicht
        </button>
        <button
          type="button"
          className="primary large"
          onClick={() => answer('stimmt')}
        >
          Stimmt
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className="text-button pl-0"
          onClick={() => answer('weiss_nicht')}
        >
          Weiß nicht
        </button>
        <button type="button" className="text-button" onClick={back}>
          Zurück
        </button>
        {isLast && (
          <button type="button" className="text-button" onClick={onSurvey}>
            Genauer? 30 kurze Fragen
          </button>
        )}
      </div>
      <p className="mt-2 hidden text-xs text-graphite md:block">
        Tastatur: Enter = Stimmt · Rücktaste = Eher nicht
      </p>
    </div>
  )
}

export { DeckStep }
