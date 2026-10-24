import { createContext, use } from 'react'

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
}

export type SurveyCategory = Survey['categories'][number]
export type Answers = Record<string, number>

export async function fetchSurvey(): Promise<Survey> {
  const response = await fetch('/api/survey')
  if (!response.ok) throw new Error(`Survey request failed: ${response.status}`)
  return response.json()
}

export function questionsIn(survey: Survey, categoryId: string | undefined) {
  return survey.questions.filter((q) => q.category === categoryId)
}

export const SurveyContext = createContext<Survey | null>(null)

export function useSurvey(): Survey {
  const survey = use(SurveyContext)
  if (!survey) throw new Error('useSurvey needs a loaded survey above it')
  return survey
}
