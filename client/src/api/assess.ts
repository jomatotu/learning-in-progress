import { useMutation } from '@tanstack/react-query'
import { streamResult, type StreamProgress } from '@/api/client'
import { useStreamProgress } from '@/api/progress'

export type Profile = {
  name: string
  challenges: string[]
  goals: string
  interests: string[]
}

export type Answer = { question: string; answer: string }

// Learning page formats the server can generate; matches the files in server/app/prompts/themes.
export type ThemeName =
  'chunked' | 'fill-blanks' | 'hobby-framing' | 'read-aloud' | 'teach-the-ai'

// A theme picked for the student. The reason is empty when the server fell back to the default theme.
export type ThemePick = { theme: ThemeName; reason: string }

export type NextQuestion = {
  done: boolean
  question: string
  options: string[]
  themes: ThemePick[]
}

export type AssessInput = { profile: Profile; answers: Answer[] }

// Streams the assessment: reports Hermes's progress, then resolves with the next question or the picked themes.
export function assess(
  input: AssessInput,
  progress: StreamProgress,
): Promise<NextQuestion> {
  return streamResult('/assess', { body: input, ...progress })
}

export function useAssess() {
  const progress = useStreamProgress()
  const mutation = useMutation({
    mutationFn: (input: AssessInput) => {
      progress.reset()
      return assess(input, progress.callbacks)
    },
  })
  return { ...mutation, status: progress.status, reasoning: progress.reasoning }
}
