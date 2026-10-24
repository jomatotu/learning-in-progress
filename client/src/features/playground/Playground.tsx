import { useState, type FormEvent } from 'react'
import { useGeneratePage, type GenerateInput } from '@/api/generate'
import { LearningPage } from '@/components/LearningPage'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { mockStudent } from './mockStudent'

// Test page for the generate step: sends the student data typed in the box to Hermes and shows the page it builds.
export function Playground() {
  const [input, setInput] = useState(JSON.stringify(mockStudent, null, 2))
  const [parseError, setParseError] = useState('')
  const generate = useGeneratePage()

  if (generate.data) {
    return (
      <LearningPage html={generate.data.html} onBack={() => generate.reset()} />
    )
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    let student: GenerateInput
    try {
      student = JSON.parse(input)
    } catch {
      setParseError('The student data is not valid JSON.')
      return
    }
    setParseError('')
    generate.mutate(student)
  }

  const error = parseError || generate.error?.message

  return (
    <main className="flex min-h-svh flex-col items-center gap-4 p-6">
      <h1 className="text-4xl font-semibold tracking-tight">
        Build playground
      </h1>
      <form onSubmit={submit} className="flex w-full max-w-3xl flex-col gap-3">
        <Textarea
          aria-label="Student data"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={20}
          className="font-mono text-sm"
          disabled={generate.isPending}
        />
        <Button type="submit" disabled={generate.isPending}>
          Build learning page
        </Button>
        {generate.isPending && (
          <p aria-live="polite" className="text-muted-foreground">
            {generate.status || 'Starting…'}
          </p>
        )}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </form>
    </main>
  )
}
