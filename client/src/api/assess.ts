import { useMutation } from '@tanstack/react-query'
import { streamResult, type StreamProgress } from '@/api/client'
import { useStreamProgress } from '@/api/progress'
import { studentId } from '@/api/studentId'

// Any student profile JSON: the application form's profile, or a test persona in the playground.
export type Profile = Record<string, unknown>

export type Answer = { question: string; answer: string }

// Learning page formats the server can generate; matches the files in server/app/prompts/themes.
export type ThemeName =
  | 'calm-reading'
  | 'chunked'
  | 'fill-blanks'
  | 'hobby-framing'
  | 'memory-palace'
  | 'read-aloud'
  | 'sim-missions'
  | 'teach-the-ai'

// Names to show the student; match the titles in the theme files.
export const themeTitles: Record<ThemeName, string> = {
  'calm-reading': 'Calm reading',
  chunked: 'Chunked steps',
  'fill-blanks': 'Fill in the blanks',
  'hobby-framing': 'Hobby framing',
  'memory-palace': 'Memory palace',
  'read-aloud': 'Read aloud',
  'sim-missions': 'Simulation missions',
  'teach-the-ai': 'Teach the AI',
}

// A theme picked for the student. The reason is empty when the server fell back to the default theme.
export type ThemePick = { theme: ThemeName; reason: string }

export type NextQuestion = {
  done: boolean
  question: string
  options: string[]
  themes: ThemePick[]
}

// The material lets Hermes skip themes that don't suit it, e.g. a memory palace for material with only one idea.
export type AssessInput = {
  profile: Profile
  answers: Answer[]
  material: string
}

// Streams the assessment: reports Hermes's progress, then resolves with the next question or the picked themes.
export function assess(
  input: AssessInput,
  progress: StreamProgress,
): Promise<NextQuestion> {
  return streamResult('/assess', {
    body: { ...input, student_id: studentId() },
    ...progress,
  })
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
