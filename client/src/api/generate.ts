import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { Answer, Profile, ThemeName } from '@/api/assess'
import { streamResult, type StreamProgress } from '@/api/client'
import { useStreamProgress } from '@/api/progress'
import { studentId } from '@/api/studentId'

export type GenerateInput = {
  profile: Profile
  answers: Answer[]
  material: string
  // The theme to build; the server uses "chunked" when it's left out.
  theme?: ThemeName
}

export type BuiltPage = { html: string }

// Streams the generation: reports Hermes's progress, then resolves with the finished page.
export function generatePage(
  input: GenerateInput,
  progress: StreamProgress,
): Promise<BuiltPage> {
  return streamResult('/generate', {
    body: { ...input, student_id: studentId() },
    ...progress,
  })
}

export function useGeneratePage() {
  const progress = useStreamProgress()
  // The half-written page, so the student watches it being built.
  const [preview, setPreview] = useState('')
  const mutation = useMutation({
    mutationFn: (input: GenerateInput) => {
      progress.reset()
      setPreview('')
      return generatePage(input, {
        ...progress.callbacks,
        onPreview: setPreview,
      })
    },
  })
  return {
    ...mutation,
    status: progress.status,
    reasoning: progress.reasoning,
    preview,
  }
}
