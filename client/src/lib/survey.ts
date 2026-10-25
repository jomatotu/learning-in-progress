import { createContext, use } from 'react'
import type { DeckEntry, Survey } from '@/api/survey'

export type { DeckEntry, Survey }

export type SurveyCategory = Survey['categories'][number]
export type Answers = Record<string, number>

export function questionsIn(survey: Survey, categoryId: string | undefined) {
  return survey.questions.filter((q) => q.category === categoryId)
}

// The server lets survey answers win: a category with any answer has no deck band.
export function deckBands(
  survey: Survey,
  bands: Record<string, string>,
  answers: Record<string, number>,
) {
  return Object.keys(bands).filter(
    (category) => !questionsIn(survey, category).some((q) => q.id in answers),
  )
}

export const SurveyContext = createContext<Survey | null>(null)

export function useSurvey(): Survey {
  const survey = use(SurveyContext)
  if (!survey) throw new Error('useSurvey needs a loaded survey above it')
  return survey
}
