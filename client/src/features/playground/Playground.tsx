import { useState, type FormEvent } from 'react'
import { useAssess, type Answer, type Profile } from '@/api/assess'
import { errorMessage } from '@/api/errorMessage'
import { HermesProgress } from '@/components/HermesProgress'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { defineMessages, useMessages } from '@/lib/i18n'
import { saveRun } from '@/features/learn/learnStore'
import { mockStudent } from './mockStudent'

// Test page for the whole flow: runs the assessment for the profile in the box, then opens a new tab that generates a page per picked theme.
const messages = defineMessages({
  en: { invalidJson: 'The profile is not valid JSON.' },
  de: { invalidJson: 'Das Profil ist kein gültiges JSON.' },
})

export function Playground() {
  const t = useMessages(messages)
  const [profileText, setProfileText] = useState(
    JSON.stringify(mockStudent.profile, null, 2),
  )
  const [material, setMaterial] = useState(mockStudent.material)
  const [parseError, setParseError] = useState('')
  // Set once the assessment starts, so every later call sends the same profile.
  const [profile, setProfile] = useState<Profile>()
  const [answers, setAnswers] = useState<Answer[]>([])
  const assess = useAssess()

  function start(event: FormEvent) {
    event.preventDefault()
    let parsed: Profile
    try {
      parsed = JSON.parse(profileText)
    } catch {
      setParseError(t.invalidJson)
      return
    }
    setParseError('')
    setProfile(parsed)
    setAnswers([])
    assess.mutate({ profile: parsed, answers: [], material })
  }

  function answer(option: string) {
    if (!profile || !assess.data) return
    const next = [
      ...answers,
      { question: assess.data.question, answer: option },
    ]
    setAnswers(next)
    assess.mutate({ profile, answers: next, material })
  }

  // Generates in a new tab, so this page keeps its answers and can open the pages again.
  function openPages() {
    if (!profile || !themes) return
    const id = saveRun({ profile, answers, material, themes })
    window.open(`/learn/${id}`, '_blank')
  }

  function restart() {
    assess.reset()
    setProfile(undefined)
    setAnswers([])
  }

  const question = assess.data?.done === false ? assess.data : undefined
  const themes = assess.data?.done ? assess.data.themes : undefined
  const busy = assess.isPending
  const error =
    parseError || (assess.error ? errorMessage(assess.error) : undefined)

  return (
    <main className="flex min-h-svh flex-col items-center gap-4 p-6">
      <h1 className="text-4xl font-semibold tracking-tight">Bau-Playground</h1>
      <form onSubmit={start} className="flex w-full max-w-3xl flex-col gap-3">
        <Textarea
          aria-label="Schülerprofil"
          value={profileText}
          onChange={(event) => setProfileText(event.target.value)}
          rows={8}
          className="field-sizing-fixed resize-y overflow-y-auto font-mono text-sm"
          disabled={profile !== undefined}
        />
        <Textarea
          aria-label="Lernmaterial"
          value={material}
          onChange={(event) => setMaterial(event.target.value)}
          rows={12}
          className="field-sizing-fixed resize-y overflow-y-auto text-sm"
          disabled={busy}
        />
        {profile === undefined && (
          <Button type="submit">Einschätzung starten</Button>
        )}
      </form>

      <section className="flex w-full max-w-3xl flex-col gap-3">
        {answers.length > 0 && (
          <ol className="list-decimal space-y-1 pl-6">
            {answers.map((item) => (
              <li key={item.question}>
                {item.question} <strong>{item.answer}</strong>
              </li>
            ))}
          </ol>
        )}

        {question && !busy && (
          <div className="flex flex-col gap-2">
            <p className="font-medium">{question.question}</p>
            <div className="flex flex-wrap gap-2">
              {question.options.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  onClick={() => answer(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}

        {themes && (
          <div className="flex flex-col gap-2">
            <p className="font-medium">
              Ausgewählte Themen, die besten zuerst:
            </p>
            <ol className="flex list-decimal flex-col gap-3 pl-6">
              {themes.map((pick) => (
                <li key={pick.theme}>
                  <strong>{pick.theme}</strong>
                  {pick.reason ? `: ${pick.reason}` : ' (Standardthema)'}
                </li>
              ))}
            </ol>
            <Button className="self-start" onClick={openPages}>
              Generieren
            </Button>
          </div>
        )}

        {busy && (
          <HermesProgress status={assess.status} reasoning={assess.reasoning} />
        )}

        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}

        {profile !== undefined && !busy && (
          <div className="flex gap-2">
            {assess.isError && (
              <Button
                onClick={() => assess.mutate({ profile, answers, material })}
              >
                Nochmal versuchen
              </Button>
            )}
            <Button variant="outline" onClick={restart}>
              Neu anfangen
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}
