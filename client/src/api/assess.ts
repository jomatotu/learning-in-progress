import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { streamResult } from '@/api/client'

export type Profile = {
  name: string
  challenges: string[]
  goals: string
  interests: string[]
  whatWorks: string
}

export type Answer = { question: string; answer: string }

export type NextQuestion = {
  done: boolean
  question: string
  options: string[]
}

export type AssessInput = { profile: Profile; answers: Answer[] }

export function assess(
  input: AssessInput,
  onStatus: (text: string) => void,
): Promise<NextQuestion> {
  return streamResult('/assess', { body: input, onStatus })
}

export function useAssess() {
  const [status, setStatus] = useState('')
  const mutation = useMutation({
    mutationFn: (input: AssessInput) => {
      setStatus('')
      return assess(input, setStatus)
    },
  })
  return { ...mutation, status }
}
