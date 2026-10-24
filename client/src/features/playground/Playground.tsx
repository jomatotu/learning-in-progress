import { useState, type FormEvent } from 'react'
import { useAssess, type Answer, type Profile } from '@/api/assess'
import { useGeneratePage } from '@/api/generate'
import { HermesProgress } from '@/components/HermesProgress'
import { LearningPage } from '@/components/LearningPage'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { mockStudent } from './mockStudent'

// Test page for the whole flow: runs the assessment for the profile in the box, then generates a learning page from the answers.
export function Playground() {
  const [profileText, setProfileText] = useState(
    JSON.stringify(mockStudent.profile, null, 2),
  )
  const [material, setMaterial] = useState(mockStudent.material)
  const [parseError, setParseError] = useState('')
  // Set once the assessment starts, so every later call sends the same profile.
  const [profile, setProfile] = useState<Profile>()
  const [answers, setAnswers] = useState<Answer[]>([])
  const assess = useAssess()
  const generate = useGeneratePage()

  if (generate.data) {
    return (
      <LearningPage html={generate.data.html} onBack={() => generate.reset()} />
    )
  }

  function start(event: FormEvent) {
    event.preventDefault()
    let parsed: Profile
    try {
      parsed = JSON.parse(profileText)
    } catch {
      setParseError('The profile is not valid JSON.')
      return
    }
    setParseError('')
    setProfile(parsed)
    setAnswers([])
    assess.mutate({ profile: parsed, answers: [] })
  }

  function answer(option: string) {
    if (!profile || !assess.data) return
    const next = [
      ...answers,
      { question: assess.data.question, answer: option },
    ]
    setAnswers(next)
    assess.mutate({ profile, answers: next })
  }

  function restart() {
    assess.reset()
    generate.reset()
    setProfile(undefined)
    setAnswers([])
  }

  const question = assess.data?.done === false ? assess.data : undefined
  const themes = assess.data?.done ? assess.data.themes : undefined
  const busy = assess.isPending || generate.isPending
  const error = parseError || assess.error?.message || generate.error?.message

  return (
    <main className="flex min-h-svh flex-col items-center gap-4 p-6">
      <h1 className="text-4xl font-semibold tracking-tight">
        Build playground
      </h1>
      <form onSubmit={start} className="flex w-full max-w-3xl flex-col gap-3">
        <Textarea
          aria-label="Student profile"
          value={profileText}
          onChange={(event) => setProfileText(event.target.value)}
          rows={8}
          className="field-sizing-fixed resize-y overflow-y-auto font-mono text-sm"
          disabled={profile !== undefined}
        />
        <Textarea
          aria-label="Learning material"
          value={material}
          onChange={(event) => setMaterial(event.target.value)}
          rows={12}
          className="field-sizing-fixed resize-y overflow-y-auto text-sm"
          disabled={busy}
        />
        {profile === undefined && (
          <Button type="submit">Start assessment</Button>
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
            <p className="font-medium">Picked themes, best first:</p>
            <ol className="flex list-decimal flex-col gap-3 pl-6">
              {themes.map((pick) => (
                <li key={pick.theme}>
                  <strong>{pick.theme}</strong>
                  {pick.reason ? `: ${pick.reason}` : ' (default theme)'}
                  {profile && (
                    <Button
                      className="mt-1 block"
                      disabled={busy}
                      onClick={() =>
                        generate.mutate({
                          profile,
                          answers,
                          material,
                          theme: pick.theme,
                        })
                      }
                    >
                      Generate {pick.theme}
                    </Button>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {busy && (
          <HermesProgress
            status={assess.isPending ? assess.status : generate.status}
            reasoning={assess.isPending ? assess.reasoning : generate.reasoning}
          />
        )}

        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}

        {profile !== undefined && !busy && (
          <div className="flex gap-2">
            {assess.isError && (
              <Button onClick={() => assess.mutate({ profile, answers })}>
                Try again
              </Button>
            )}
            <Button variant="outline" onClick={restart}>
              Start again
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}
