import { useMutation } from '@tanstack/react-query'
import type { Answer, Profile, ThemeName } from '@/api/assess'
import { streamResult, type StreamProgress } from '@/api/client'
import { useStreamProgress } from '@/api/progress'

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
  return streamResult('/generate', { body: input, ...progress })
}

export function useGeneratePage() {
  const progress = useStreamProgress()
  const mutation = useMutation({
    mutationFn: (input: GenerateInput) => {
      progress.reset()
      return generatePage(input, progress.callbacks)
    },
  })
  return { ...mutation, status: progress.status, reasoning: progress.reasoning }
}
