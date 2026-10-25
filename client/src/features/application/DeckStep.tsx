import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { CardAnswer, HermesCard } from '@/api/intake'
import type { DeckEntry } from '@/lib/survey'
import { StepHeading } from './StepHeading'
import {
  answerBands,
  nextDeckState,
  nextHermesCard,
  type Band,
  type DeckAnswer,
  type DeckState,
} from './deck'
import { TUTOR } from '@/lib/tutor'
import { cn } from '@/lib/utils'

type Side = 'stimmt' | 'eher_nicht'

const KEYS: Record<string, Side> = {
  Enter: 'stimmt',
  ArrowRight: 'stimmt',
  Backspace: 'eher_nicht',
  ArrowLeft: 'eher_nicht',
}
// A swipe counts past 30% of the card width, or as a quick flick of at least 40px.
const SWIPE_SHARE = 0.3
const FLICK_PX = 40
const FLICK_PX_PER_MS = 0.5
const FLY_MS = 220

const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const passed = (dx: number, width: number): Side | null =>
  Math.abs(dx) < Math.max(width * SWIPE_SHARE, FLICK_PX)
    ? null
    : dx > 0
      ? 'stimmt'
      : 'eher_nicht'

// Fields and buttons handle keys themselves; a shortcut there would answer twice or eat typing.
function keepsKey(key: string, target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.closest('input, textarea, select, [contenteditable]')) return true
  return key === 'Enter' && !!target.closest('button, a')
}

// Where the student is: a base card (hermesId null) or a Hermes card, with the Hermes answers so far.
type Snapshot = {
  state: DeckState
  hermesId: string | null
  answers: CardAnswer[]
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
  hermesCards,
  onCardAnswers,
}: {
  deck: DeckEntry[]
  bands: Record<string, Band>
  onBands: (bands: Record<string, Band>) => void
  onDone: () => void
  onSurvey: () => void
  onBack: () => void
  // Hermes's cards once they have arrived; they follow the base cards.
  hermesCards: HermesCard[] | null
  onCardAnswers: (answers: CardAnswer[]) => void
}) {
  const [state, setState] = useState<DeckState>({
    index: 0,
    asked: 'low',
    bands,
  })
  const [hermesId, setHermesId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<CardAnswer[]>([])
  // What each earlier card looked like, so "Zurück" can take an answer back.
  const [history, setHistory] = useState<Snapshot[]>([])
  // The card under the finger: how far it is pulled, and the side it flies off to once answered.
  const [pull, setPull] = useState({ dx: 0, width: 0, active: false })
  const [leaving, setLeaving] = useState<Side | null>(null)
  const drag = useRef<{ id: number; x: number; t: number } | null>(null)
  // Set while a card flies off; every other answer waits, so one swipe stays one answer.
  const flying = useRef<number | undefined>(undefined)
  const root = useRef<HTMLDivElement>(null)

  const goTo = (next: Snapshot) => {
    setHistory((h) => [...h, { state, hermesId, answers }])
    setState(next.state)
    setHermesId(next.hermesId)
    setAnswers(next.answers)
    onCardAnswers(next.answers)
  }

  const answerHermes = (id: string, choice: DeckAnswer) => {
    const kept =
      choice === 'weiss_nicht' ? answers : [...answers, { id, answer: choice }]
    const next = nextHermesCard(hermesCards ?? [], id, choice)
    if (next === 'done') {
      onCardAnswers(kept)
      return onDone()
    }
    goTo({ state, hermesId: next, answers: kept })
  }

  const answer = (choice: DeckAnswer) => {
    if (flying.current !== undefined) return
    if (hermesId) return answerHermes(hermesId, choice)
    const nextBands = answerBands(state, choice, deck)
    onBands(nextBands)
    const next = nextDeckState(state, choice, deck)
    if (next !== 'done') return goTo({ state: next, hermesId, answers })
    const first = hermesCards?.[0]
    if (!first) {
      onCardAnswers([])
      return onDone()
    }
    goTo({ state: { ...state, bands: nextBands }, hermesId: first.id, answers })
  }

  const back = () => {
    if (flying.current !== undefined) return
    const previous = history[history.length - 1]
    if (!previous) return onBack()
    onBands(previous.state.bands)
    onCardAnswers(previous.answers)
    setHistory(history.slice(0, -1))
    setState(previous.state)
    setHermesId(previous.hermesId)
    setAnswers(previous.answers)
  }

  // Swipes and arrow keys let the card fly off to its side, then answer like the buttons.
  const fling = (side: Side) => {
    if (flying.current !== undefined) return
    if (reducedMotion()) {
      setPull({ dx: 0, width: 0, active: false })
      return answer(side)
    }
    setLeaving(side)
    flying.current = window.setTimeout(() => {
      flying.current = undefined
      setLeaving(null)
      setPull({ dx: 0, width: 0, active: false })
      latest.current.answer(side)
    }, FLY_MS)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current || flying.current !== undefined) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { id: e.pointerId, x: e.clientX, t: performance.now() }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const width = e.currentTarget.getBoundingClientRect().width
    setPull({ dx: 0, width, active: true })
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    if (start?.id !== e.pointerId) return
    setPull((p) => ({ ...p, dx: e.clientX - start.x }))
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    if (start?.id !== e.pointerId) return
    drag.current = null
    const dx = e.clientX - start.x
    const speed = Math.abs(dx) / Math.max(performance.now() - start.t, 1)
    const flick = Math.abs(dx) >= FLICK_PX && speed >= FLICK_PX_PER_MS
    if (passed(dx, pull.width) || flick) {
      // Transitions back on, so the card flies off from where it was let go.
      setPull((p) => ({ ...p, active: false }))
      return fling(dx > 0 ? 'stimmt' : 'eher_nicht')
    }
    setPull({ dx: 0, width: 0, active: false })
  }

  const onPointerCancel = () => {
    drag.current = null
    setPull({ dx: 0, width: 0, active: false })
  }

  useEffect(() => () => window.clearTimeout(flying.current), [])

  // The key handler always calls the latest answer() and fling().
  const latest = useRef({ answer, fling })
  useEffect(() => {
    latest.current = { answer, fling }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      const side = KEYS[e.key]
      if (!side || keepsKey(e.key, e.target)) return
      const arrow = e.key.startsWith('Arrow')
      // Arrows only count inside the deck; elsewhere they still scroll or move a cursor.
      if (
        arrow &&
        !(e.target instanceof Node && root.current?.contains(e.target))
      )
        return
      e.preventDefault()
      if (arrow) latest.current.fling(side)
      else latest.current.answer(side)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const entry = deck[state.index]
  const card = entry[state.asked]
  const hermes = hermesId
    ? (hermesCards?.find((c) => c.id === hermesId) ?? null)
    : null
  const shown = history.length
  // Morph cards keep the last base state, so only base snapshots count as extra high cards.
  const extra = [...history, { state, hermesId }].filter(
    (s) => !s.hermesId && s.state.asked === 'high',
  ).length
  // A Hermes path is at most 3 cards; count them once the cards are here.
  const total = Math.max(
    deck.length + extra + Math.min(hermesCards?.length ?? 0, 3),
    shown + 1,
  )
  const isLast = state.index === deck.length - 1
  const hint = leaving ?? passed(pull.dx, pull.width)
  // Under reduced motion the card only follows the finger, without tilting.
  const tilt = reducedMotion() ? '' : ` rotate(${pull.dx / 20}deg)`
  const flyOff =
    leaving === 'stimmt'
      ? 'translateX(130%) rotate(12deg)'
      : 'translateX(-130%) rotate(-12deg)'

  return (
    // Focusable root: a tap or click on the card keeps focus in the deck, so the arrow keys keep working.
    <div ref={root} tabIndex={-1} className="outline-none">
      <StepHeading
        label={`Wie du lernst · ${hermes ? TUTOR : entry.title}`}
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
        <div
          key={shown}
          data-testid="deck-card"
          className="relative cursor-grab touch-pan-y rounded-[18px] bg-ink p-6 text-white transition-[transform,translate,opacity] duration-200 ease-out select-none active:cursor-grabbing motion-reduce:transition-none motion-safe:starting:translate-y-3 motion-safe:starting:opacity-0"
          style={{
            transform: leaving
              ? flyOff
              : pull.dx
                ? `translateX(${pull.dx}px)${tilt}`
                : undefined,
            opacity: leaving ? 0 : undefined,
            transition: pull.active ? 'none' : undefined,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {hint && (
            <span
              aria-hidden
              className={cn(
                'absolute -top-3 rounded-full px-3 py-1 text-sm font-bold shadow-sm',
                hint === 'stimmt'
                  ? 'left-5 bg-[#6955c6] text-white'
                  : 'right-5 border border-ink bg-white text-ink',
              )}
            >
              {hint === 'stimmt' ? 'Stimmt' : 'Eher nicht'}
            </span>
          )}
          <span className="mb-2 block text-[0.7rem] font-bold tracking-[0.04em] text-[#bcb0f2]">
            {hermes ? `${TUTOR} fragt` : 'Das heißt für dich'}
          </span>
          <p className="text-[1.2rem] leading-snug font-semibold [overflow-wrap:anywhere]">
            {hermes ? hermes.text : card.text}
          </p>
        </div>
        <p className="mx-0.5 mt-3 mb-6 text-sm [overflow-wrap:anywhere] text-graphite">
          {hermes ? '' : card.reason}
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
        {isLast && !hermes && (
          <button type="button" className="text-button" onClick={onSurvey}>
            Genauer? 30 kurze Fragen
          </button>
        )}
      </div>
      <p className="mt-2 hidden text-xs text-graphite md:block">
        Tastatur: → oder Enter = Stimmt · ← oder Rücktaste = Eher nicht
      </p>
      <p className="mt-2 hidden text-xs text-graphite pointer-coarse:block">
        Wischen: nach rechts = Stimmt · nach links = Eher nicht
      </p>
    </div>
  )
}

export { DeckStep }
