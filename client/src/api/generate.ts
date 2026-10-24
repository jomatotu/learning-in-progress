import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { Answer, Profile } from '@/api/assess'
import { streamResult } from '@/api/client'

export type GenerateInput = {
  profile: Profile
  answers: Answer[]
  material: string
}

export type BuiltPage = { html: string }

// Streams the generation: calls onStatus with Hermes's progress, then resolves with the finished page.
export function generatePage(
  input: GenerateInput,
  onStatus: (text: string) => void,
): Promise<BuiltPage> {
  return streamResult('/generate', { body: input, onStatus })
}

export function useGeneratePage() {
  const [status, setStatus] = useState('')
  const mutation = useMutation({
    mutationFn: (input: GenerateInput) => {
      setStatus('')
      return generatePage(input, setStatus)
    },
  })
  return { ...mutation, status }
}
