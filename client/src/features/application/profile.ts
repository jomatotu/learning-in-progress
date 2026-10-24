import type { Answers, Survey } from '@/lib/survey'
import { optionMessages } from './options'

// Everything the application form collects. Sent to the server as the student profile.
export type Profile = {
  name: string
  stage: string
  stageDetail: string
  interests: string
  goalType: string
  goal: string
  deadline: string
  topic: string
  texts: string[]
  links: string[]
  files: File[]
  answers: Answers
  likes: string[]
  notes: string
}

export const emptyProfile: Profile = {
  name: '',
  stage: '',
  stageDetail: '',
  interests: '',
  goalType: '',
  goal: '',
  deadline: '',
  topic: '',
  texts: [],
  links: [],
  files: [],
  answers: {},
  likes: [],
  notes: '',
}

// The stored values for each choice. Their display texts, in both languages, are in options.ts.
export const stages = Object.keys(optionMessages.en.stages)

export const goalTypes = Object.keys(optionMessages.en.goalTypes)

export const likeSuggestions = Object.keys(optionMessages.en.likes)

export type StepId = 'about' | 'goal' | 'survey' | 'notes' | 'review'

// Step titles, in both languages, are in options.ts.
export const steps: { id: StepId }[] = [
  { id: 'about' },
  { id: 'about' },
  { id: 'goal' },
  { id: 'survey' },
  { id: 'notes' },
  { id: 'review' },
]

// One screen per step, except the survey, which gets one screen per category.
export type Screen = { step: StepId; categoryId?: string; minutes: number }

const surveyMinutes = 5

export function buildScreens(survey: Survey): Screen[] {
  return [
    { step: 'about', minutes: 1 },
    { step: 'goal', minutes: 2 },
    ...survey.categories.map((c) => ({
      step: 'survey' as const,
      categoryId: c.id,
      minutes: surveyMinutes / survey.categories.length,
    })),
    { step: 'notes', minutes: 1 },
    { step: 'review', minutes: 1 },
  ]
}

// Only text fields survive a reload; File objects can't be stored.
const storageKey = 'application-form'

export function loadProfile(): Profile {
  try {
    const saved = sessionStorage.getItem(storageKey)
    return saved
      ? { ...emptyProfile, ...JSON.parse(saved), files: [] }
      : emptyProfile
  } catch {
    return emptyProfile
  }
}

export function saveProfile(profile: Profile) {
  try {
    const { files: _files, ...rest } = profile
    sessionStorage.setItem(storageKey, JSON.stringify(rest))
  } catch {
    // Storage can be blocked (private mode); the form still works without it.
  }
}
