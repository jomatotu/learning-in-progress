import { useState, type FormEvent } from 'react'
import type { ThemeName } from '@/api/assess'
import { request } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import { studentId } from '@/api/studentId'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { defineMessages, useMessages } from '@/lib/i18n'
import { TUTOR } from '@/lib/tutor'

const messages = defineMessages({
  en: {
    label: (tutor: string) => `What should ${tutor} do differently next time?`,
    send: 'Send',
    sent: (tutor: string) => `Thanks! ${tutor} will keep it in mind next time.`,
    failed: 'That didn’t work.',
  },
  de: {
    label: (tutor: string) =>
      `Was soll ${tutor} beim nächsten Mal anders machen?`,
    send: 'Senden',
    sent: (tutor: string) => `Danke! ${tutor} denkt beim nächsten Mal daran.`,
    failed: 'Das hat nicht geklappt.',
  },
})

// Matches the server's cap on one learner note.
const MAX_CHARS = 500

type FeedbackBoxProps = { theme: ThemeName }

// Asks the student what Hermes should change; the server keeps it for the next session.
export function FeedbackBox({ theme }: FeedbackBoxProps) {
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const t = useMessages(messages)
  const [error, setError] = useState('')

  async function send(event: FormEvent) {
    event.preventDefault()
    setState('sending')
    setError('')
    try {
      await request('/feedback', {
        method: 'POST',
        body: { student_id: studentId(), theme, text: text.trim() },
      })
      setText('')
      setState('sent')
    } catch (failure) {
      setError(errorMessage(failure, t.failed))
      setState('idle')
    }
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-2">
      <label htmlFor={`feedback-${theme}`} className="text-sm font-medium">
        {t.label(TUTOR)}
      </label>
      <Textarea
        id={`feedback-${theme}`}
        value={text}
        maxLength={MAX_CHARS}
        onChange={(event) => setText(event.target.value)}
      />
      <Button
        type="submit"
        className="self-start"
        disabled={!text.trim() || state === 'sending'}
      >
        {t.send}
      </Button>
      <p aria-live="polite" className="text-sm">
        {state === 'sent' && t.sent(TUTOR)}
        {error}
      </p>
    </form>
  )
}
