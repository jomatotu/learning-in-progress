import { useMutation } from '@tanstack/react-query'
import { streamResult, type StreamProgress } from '@/api/client'
import type { StudentProfile } from '@/api/profile'
import { useStreamProgress } from '@/api/progress'

// One strategy Hermes found on the web for this student, with the page it read it on.
export type Finding = {
  need: string
  strategy: string
  how_to_apply: string
  source_title: string
  source_url: string
}

export type Research = { findings: Finding[]; summary: string }

// What Hermes researches from: everything the student told us, without the pasted material.
export function researchBody(profile: StudentProfile) {
  const { student, goal, preferences, learning_instructions, about_you } =
    profile
  return {
    student,
    goal,
    topic: profile.material.topic,
    preferences,
    learning_instructions,
    about_you,
  }
}

// Web research takes Hermes a few minutes; the server stops it after 300 s.
export function research(
  profile: StudentProfile,
  progress: StreamProgress,
): Promise<Research> {
  return streamResult('/research', {
    body: researchBody(profile),
    timeoutMs: 330_000,
    ...progress,
  })
}

export function useResearch() {
  const progress = useStreamProgress()
  const mutation = useMutation({
    mutationFn: (profile: StudentProfile) => {
      progress.reset()
      return research(profile, progress.callbacks)
    },
  })
  return { ...mutation, status: progress.status, reasoning: progress.reasoning }
}
