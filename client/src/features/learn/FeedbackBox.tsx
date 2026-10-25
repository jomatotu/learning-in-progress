import { useState, type FormEvent } from 'react'
import type { ThemeName } from '@/api/assess'
import { request } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import { studentId } from '@/api/studentId'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

// Matches the server's cap on one learner note.
const MAX_CHARS = 500

type FeedbackBoxProps = { theme: ThemeName }

// Asks the student what Hermes should change; the server keeps it for the next session.
export function FeedbackBox({ theme }: FeedbackBoxProps) {
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
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
      setError(errorMessage(failure, 'Das hat nicht geklappt.'))
      setState('idle')
    }
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-2">
      <label htmlFor={`feedback-${theme}`} className="text-sm font-medium">
        Was soll Hermes beim nächsten Mal anders machen?
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
        Senden
      </Button>
      <p aria-live="polite" className="text-sm">
        {state === 'sent' && 'Danke! Hermes denkt beim nächsten Mal daran.'}
        {error}
      </p>
    </form>
  )
}
