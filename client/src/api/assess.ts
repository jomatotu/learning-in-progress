import { useMutation } from '@tanstack/react-query'
import { request } from '@/api/client'

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

export function assess(input: AssessInput): Promise<NextQuestion> {
  // Gemini can take about a minute to answer.
  return request('/assess', { method: 'POST', body: input, timeoutMs: 120_000 })
}

export function useAssess() {
  return useMutation({ mutationFn: assess })
}
