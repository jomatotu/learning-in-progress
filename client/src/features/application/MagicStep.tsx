import { useEffect, useRef, useState } from 'react'
import type { Spec } from '@json-render/core'
import { Sparkles } from 'lucide-react'
import type { StudentProfile } from '@/api/profile'
import { errorMessage } from '@/api/errorMessage'
import { generateSolution } from './solution'
import { LessonView } from '@/catalog/LessonView'
import { HermesProgress } from '@/components/HermesProgress'
import type { MorphStep } from '@/components/MorphLoader'
import { defineMessages, useMessages } from '@/lib/i18n'

const messages = defineMessages({
  de: {
    kicker: 'Für dich gebaut',
    title: 'Hier entsteht',
    titleEm: 'deine magische Lösung.',
    waiting: 'Einen Moment — das dauert ein bis zwei Minuten.',
    ready: (topic: string) =>
      `${topic || 'Dein Thema'}, in einer Form, die zu dir passt.`,
    open: 'Lösung öffnen',
    failed:
      'Das hat nicht geklappt. Prüf deine Verbindung und versuch es nochmal.',
  },
  en: {
    kicker: 'Built for you',
    title: 'This is where',
    titleEm: 'your magic solution takes shape.',
    waiting: 'One moment — this takes one to two minutes.',
    ready: (topic: string) =>
      `${topic || 'Your topic'}, in a form that fits you.`,
    open: 'Open solution',
    failed: 'That didn’t work. Check your connection and try again.',
  },
})

const READING_MS = 20_000

// The Magic Page: shown after "Build my tool". "Lösung öffnen" has Hermes build the
// student's lesson as a json-render spec, then renders it here with our catalog.
// Styling comes from the deprecated onboarding flow (onboarding.css). The tailwind
// classes pull the section out of the application card's width container, so the
// screen is full-bleed like it was on the old home page.
export function MagicStep({
  topic,
  profileJson,
}: {
  topic: string
  profileJson: StudentProfile
}) {
  const t = useMessages(messages)
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle')
  const [error, setError] = useState('')
  const [spec, setSpec] = useState<Spec | null>(null)
  // Reading first, then shaping; this call streams no progress, so time decides.
  const [step, setStep] = useState<MorphStep>(0)
  const timer = useRef<number>(undefined)

  const start = () => {
    setStatus('generating')
    setStep(0)
    timer.current = window.setTimeout(() => setStep(1), READING_MS)
    generateSolution(profileJson).then(
      (reply) => {
        window.clearTimeout(timer.current)
        setSpec(reply.spec)
      },
      (e: unknown) => {
        window.clearTimeout(timer.current)
        setError(errorMessage(e, t.failed))
        setStatus('error')
      },
    )
  }

  // Starts on arrival: the student already clicked build, a second click felt like a dead end.
  // The ref keeps StrictMode's second effect run from starting Hermes twice.
  const started = useRef(false)
  useEffect(() => {
    if (!started.current) {
      started.current = true
      start()
    }
    return () => window.clearTimeout(timer.current)
    // oxlint-disable-next-line react/exhaustive-deps
  }, [])

  if (spec) {
    return (
      <div className="mx-auto w-full max-w-3xl py-8">
        <LessonView spec={spec} />
      </div>
    )
  }

  return (
    <section className="magic-screen flex-1 rounded-[20px]">
      <div className="magic-orbit orbit-a" />
      <div className="magic-orbit orbit-b" />
      <div className="magic-particle particle-a">
        <Sparkles size={18} />
      </div>
      <div className="magic-particle particle-b" />
      <div className="magic-particle particle-c" />
      <div className="magic-content">
        <span className="magic-mark">
          <Sparkles size={34} />
        </span>
        <span className="kicker">{t.kicker}</span>
        <h1>
          {t.title}
          <br />
          <em>{t.titleEm}</em>
        </h1>
        <p>{status === 'generating' ? t.waiting : t.ready(topic)}</p>

        {status === 'generating' ? (
          // No progress stream here, so the raw view shows the elapsed time only.
          <HermesProgress status="" reasoning="" step={step} shape />
        ) : (
          <button className="magic-button" onClick={start}>
            <Sparkles size={18} /> {t.open}
          </button>
        )}
        {status === 'error' && (
          <p role="alert" className="magic-back text-[13px]">
            {error}
          </p>
        )}
      </div>
    </section>
  )
}
