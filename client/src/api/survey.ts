import { useQuery } from '@tanstack/react-query'
import { request } from '@/api/client'

// The learning survey as GET /api/survey returns it. The server owns the questions and does the scoring;
// the client only shows them and collects answers.
export type Survey = {
  version: string
  response_scale: { min: number; max: number; labels: string[] }
  categories: { id: string; title: string; hint: string }[]
  questions: {
    id: string
    category: string
    text: string
    priority: 'high' | 'low'
  }[]
  // The yes/no mirror cards of the intake deck, one per category.
  deck: DeckEntry[]
}

export type DeckEntry = {
  category: string
  title: string
  low: { text: string; reason: string }
  medium: { text: string }
  high: { text: string; reason: string }
}

export function getSurvey(): Promise<Survey> {
  return request('/survey')
}

export function useSurveyQuestions() {
  return useQuery({ queryKey: ['survey'], queryFn: getSurvey })
}
