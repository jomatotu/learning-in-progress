import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Field } from './Field'
import { StepHeading } from './StepHeading'
import type { StepProps } from './ApplicationForm'
import { defineMessages, useMessages } from '@/lib/i18n'
import { TUTOR } from '@/lib/tutor'

const messages = defineMessages({
  en: {
    label: (tutor: string) => `How you learn · ${tutor}`,
    hint: 'You can change or leave out anything.',
    title: 'What I',
    titleEm: 'understood',
    field: 'What I understood',
    loading: (tutor: string) => `${tutor} is summing up what it understood …`,
    failed: 'That didn’t work this time – no problem.',
    keep: 'That’s right',
    skip: 'Skip',
    next: 'Continue',
  },
  de: {
    label: (tutor: string) => `Wie du lernst · ${tutor}`,
    hint: 'Du kannst alles ändern oder weglassen.',
    title: 'Das habe ich',
    titleEm: 'verstanden',
    field: 'Das habe ich verstanden',
    loading: (tutor: string) =>
      `${tutor} fasst zusammen, was es verstanden hat …`,
    failed: 'Hat diesmal nicht geklappt – kein Problem.',
    keep: 'Stimmt so',
    skip: 'Überspringen',
    next: 'Weiter',
  },
})

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
  const t = useMessages(messages)
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
      <StepHeading label={t.label(TUTOR)} hint={t.hint}>
        {t.title} <em>{t.titleEm}</em>
      </StepHeading>

      <div aria-live="polite">
        {phase === 'loading' && (
          <p className="text-graphite">{t.loading(TUTOR)}</p>
        )}
        {phase === 'failed' && <p className="text-graphite">{t.failed}</p>}
      </div>

      {phase === 'ready' && (
        <Field id="about_you" label={t.field}>
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
              {t.keep}
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
              {t.skip}
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
            {t.next}
            <ArrowRight size={18} aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}

export { SummaryStep }
