import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { request } from '@/api/client'
import type { Lang } from '@/lib/i18n'

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

// The survey texts come in English or German; ids, order, and priorities are the same in both.
export function getSurvey(lang: Lang = 'en'): Promise<Survey> {
  return request(`/survey?lang=${lang}`)
}

// Keeps showing the current survey while another language loads, so the form stays on the same step.
export function useSurveyQuestions(lang: Lang = 'en') {
  return useQuery({
    queryKey: ['survey', lang],
    queryFn: () => getSurvey(lang),
    placeholderData: keepPreviousData,
  })
}
