import { useEffect, useRef, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import type { StudentProfile } from '@/api/profile'
import { generateSolution } from './solution'
import { defineMessages, useMessages } from '@/lib/i18n'

const messages = defineMessages({
  de: {
    // Rotating status lines shown while Hermes builds the Solution Page.
    buzzwords: [
      'Dein Profil wird gelesen…',
      'Deine Lösung wird gebaut…',
      'Das Material wird angepasst…',
      'Alles wird geprüft…',
    ],
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
    buzzwords: [
      'Reading your profile…',
      'Building your solution…',
      'Adapting the material…',
      'Checking everything…',
    ],
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

// The Magic Page: shown after "Build my tool". "Lösung öffnen" has Hermes build the
// Solution Page, then redirects to it.
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
  const { buzzwords } = t
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle')
  const [step, setStep] = useState(0)
  const buzzword = buzzwords[step % buzzwords.length]
  const interval = useRef<number>(undefined)

  const start = () => {
    setStatus('generating')
    interval.current = window.setInterval(() => {
      setStep((current) => current + 1)
    }, 2500)
    generateSolution(profileJson).then(
      ({ url }) => {
        window.location.href = url
      },
      () => {
        window.clearInterval(interval.current)
        setStatus('error')
      },
    )
  }

  useEffect(() => () => window.clearInterval(interval.current), [])

  return (
    <section className="magic-screen relative left-1/2 w-screen -translate-x-1/2">
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

        {status === 'generating' && (
          <div
            className="mb-8 flex items-center justify-center gap-2"
            aria-hidden
          >
            <span className="flex gap-2">
              {buzzwords.map((b) => (
                <i
                  key={b}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    b === buzzword ? 'bg-[#6955c6]' : 'bg-[#6955c6]/25'
                  }`}
                />
              ))}
            </span>
          </div>
        )}

        <button
          className="magic-button disabled:cursor-wait disabled:opacity-70"
          disabled={status === 'generating'}
          onClick={start}
          aria-live="polite"
        >
          {status === 'generating' ? (
            <>
              <Loader2 className="animate-spin" size={18} aria-hidden />
              {buzzword}
            </>
          ) : (
            <>
              <Sparkles size={18} /> {t.open}
            </>
          )}
        </button>
        {status === 'error' && (
          <p role="alert" className="magic-back text-[13px]">
            {t.failed}
          </p>
        )}
      </div>
    </section>
  )
}
