import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Copy } from 'lucide-react'
import { themeTitles, useAssess, type Answer } from '@/api/assess'
import type { StudentProfile } from '@/api/profile'
import type { Research } from '@/api/research'
import { HermesProgress } from '@/components/HermesProgress'
import { defineMessages, useMessages } from '@/lib/i18n'
import { saveRun } from '@/features/learn/learnStore'
import { ResearchCard } from './ResearchCard'
import { materialText, profileForHermes } from './studentProfile'

const messages = defineMessages({
  en: {
    kicker: 'Your profile is ready',
    thanks: (name: string) => `Thanks, ${name}.`,
    titleEm: 'A few quick questions.',
    bestFit: 'These fit you best, best first:',
    generate: 'Generate',
    tryAgain: 'Try again',
    back: 'Back to my profile',
    seeJson: 'See your profile JSON',
    copied: 'Copied',
    copy: 'Copy JSON',
  },
  de: {
    kicker: 'Dein Profil steht',
    thanks: (name: string) => `Danke, ${name}.`,
    titleEm: 'Noch ein paar kurze Fragen.',
    bestFit: 'Das passt am besten zu dir, das Beste zuerst:',
    generate: 'Erstellen',
    tryAgain: 'Nochmal versuchen',
    back: 'Zurück zu meinem Profil',
    seeJson: 'Dein Profil als JSON ansehen',
    copied: 'Kopiert',
    copy: 'JSON kopieren',
  },
})

// Shown after "Build my tool": Hermes asks a few questions and researches the web for this student at the same
// time, picks the themes, and Generate opens the pages in a new tab.
function AssessmentScreen({
  name,
  studentProfile,
  onBack,
}: {
  name: string
  studentProfile: StudentProfile
  onBack: () => void
}) {
  const assess = useAssess()
  const t = useMessages(messages)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [research, setResearch] = useState<Research | null>(null)
  const profile = profileForHermes(studentProfile)
  const material = materialText(studentProfile)
  const started = useRef(false)

  useEffect(() => {
    // The ref stops StrictMode's second effect run from asking Hermes twice.
    if (started.current) return
    started.current = true
    assess.mutate({ profile, answers: [], material })
    // oxlint-disable-next-line react/exhaustive-deps
  }, [])

  const question = assess.data?.done === false ? assess.data : undefined
  const themes = assess.data?.done ? assess.data.themes : undefined

  function answer(option: string) {
    if (!question) return
    const next = [...answers, { question: question.question, answer: option }]
    setAnswers(next)
    assess.mutate({ profile, answers: next, material })
  }

  // Generates in a new tab, so this page keeps the answers and can open the pages again.
  function generate() {
    if (!themes) return
    // Findings that arrived in time go along in the profile, so the page applies what Hermes found.
    const id = saveRun({
      profile: research ? { ...profile, research: research.findings } : profile,
      answers,
      material,
      themes,
    })
    window.open(`/learn/${id}`, '_blank')
  }

  return (
    <div className="rounded-[20px] border border-rule bg-sheet p-5 shadow-card sm:p-8 md:p-14">
      <span className="kicker">{t.kicker}</span>
      <h2
        tabIndex={-1}
        className="mt-3 max-w-[22ch] text-[2.2rem] outline-none md:text-[2.8rem]"
      >
        {t.thanks(name)} <em>{t.titleEm}</em>
      </h2>

      {answers.length > 0 && (
        <ol className="mt-8 flex list-decimal flex-col gap-1 pl-6 text-graphite">
          {answers.map((item) => (
            <li key={item.question}>
              {item.question}{' '}
              <strong className="text-ink">{item.answer}</strong>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 flex flex-col gap-4">
        {assess.isPending && (
          <HermesProgress status={assess.status} reasoning={assess.reasoning} />
        )}

        {question && !assess.isPending && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-xl font-medium">
              {question.question}
            </legend>
            <div className="flex flex-wrap gap-2">
              {question.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="secondary-button wrap"
                  onClick={() => answer(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {themes && (
          <div className="flex flex-col gap-4">
            <p className="text-xl font-medium">{t.bestFit}</p>
            <ol className="flex list-decimal flex-col gap-2 pl-6">
              {themes.map((pick) => (
                <li key={pick.theme}>
                  <strong>{themeTitles[pick.theme]}</strong>
                  {pick.reason && `: ${pick.reason}`}
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="primary large self-start"
              onClick={generate}
            >
              {t.generate}
              <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        )}

        {assess.isError && (
          <div role="alert" className="border-l-[3px] border-clay pl-3">
            <p>{assess.error.message}</p>
            <button
              type="button"
              className="primary mt-4"
              onClick={() => assess.mutate({ profile, answers, material })}
            >
              {t.tryAgain}
            </button>
          </div>
        )}
      </div>

      <div className="mt-8">
        <ResearchCard profile={studentProfile} onDone={setResearch} />
      </div>

      {/* For the team: /application?debug shows the profile JSON the server built. */}
      {new URLSearchParams(window.location.search).has('debug') && (
        <ProfileJson profile={studentProfile} />
      )}

      <button className="text-button mt-6 pl-0" onClick={onBack}>
        {t.back}
      </button>
    </div>
  )
}

// The profile JSON the server built, for the team and the demo.
function ProfileJson({ profile }: { profile: StudentProfile }) {
  const [copied, setCopied] = useState(false)
  const t = useMessages(messages)
  const json = JSON.stringify(profile, null, 2)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <details className="mt-10 rounded-2xl border border-rule bg-paper">
      <summary className="cursor-pointer px-5 py-4 font-normal">
        {t.seeJson}
      </summary>
      <div className="border-t border-rule p-5">
        <div className="mb-3 flex justify-end">
          <button type="button" className="secondary-button" onClick={copy}>
            {copied ? (
              <Check size={16} aria-hidden />
            ) : (
              <Copy size={16} aria-hidden />
            )}
            {copied ? t.copied : t.copy}
          </button>
        </div>
        <pre className="max-h-96 overflow-auto rounded-xl bg-sheet p-4 font-mono text-[0.78rem] leading-relaxed">
          {json}
        </pre>
      </div>
    </details>
  )
}

export { AssessmentScreen }
