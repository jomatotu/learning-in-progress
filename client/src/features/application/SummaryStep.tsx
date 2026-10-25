import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Field } from './Field'
import { StepHeading } from './StepHeading'
import type { StepProps } from './ApplicationForm'

type Phase = 'loading' | 'ready' | 'failed'

// "Das habe ich verstanden": Hermes's summary of the student, which they keep, edit or skip.
// A missing or failed summary is never an error for the student.
function SummaryStep({
  profile,
  update,
  load,
  onNext,
}: Pick<StepProps, 'profile' | 'update'> & {
  load: () => Promise<string | null>
  onNext: () => void
}) {
  const [phase, setPhase] = useState<Phase>(
    profile.about_you ? 'ready' : 'loading',
  )
  const [text, setText] = useState(profile.about_you)
  const area = useRef<HTMLTextAreaElement>(null)
  const waited = useRef(phase === 'loading')

  // Runs once on mount; the form caches the request, so coming back here asks Hermes nothing new.
  useEffect(() => {
    if (phase !== 'loading') return undefined
    let current = true
    load().then(
      (summary) => {
        if (!current) return
        setText(summary ?? '')
        setPhase(summary ? 'ready' : 'failed')
      },
      () => current && setPhase('failed'),
    )
    return () => {
      current = false
    }
    // oxlint-disable-next-line react/exhaustive-deps
  }, [])

  // The summary arrived while the student waited: move them to it.
  useEffect(() => {
    if (phase === 'ready' && waited.current) area.current?.focus()
  }, [phase])

  const keep = () => {
    update({ about_you: text.trim() })
    onNext()
  }

  return (
    <div>
      <StepHeading
        label="Wie du lernst · Hermes"
        hint="Du kannst alles ändern oder weglassen."
      >
        Das habe ich <em>verstanden</em>
      </StepHeading>

      <div aria-live="polite">
        {phase === 'loading' && (
          <p className="text-graphite">
            Hermes fasst zusammen, was es verstanden hat …
          </p>
        )}
        {phase === 'failed' && (
          <p className="text-graphite">
            Hat diesmal nicht geklappt – kein Problem.
          </p>
        )}
      </div>

      {phase === 'ready' && (
        <Field id="about_you" label="Das habe ich verstanden">
          <Textarea
            ref={area}
            id="about_you"
            value={text}
            maxLength={1000}
            rows={7}
            onChange={(e) => setText(e.target.value)}
          />
        </Field>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {phase === 'ready' && (
          <>
            <button type="button" className="primary large" onClick={keep}>
              Stimmt so
              <ArrowRight size={18} aria-hidden />
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                update({ about_you: '' })
                onNext()
              }}
            >
              Überspringen
            </button>
          </>
        )}
        {phase === 'failed' && (
          <button
            type="button"
            className="primary large"
            onClick={() => {
              update({ about_you: '' })
              onNext()
            }}
          >
            Weiter
            <ArrowRight size={18} aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}

export { SummaryStep }
