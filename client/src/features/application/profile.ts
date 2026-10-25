import type { Answers, Survey } from '@/lib/survey'
import type { Band } from './deck'
import { optionMessages } from './options'

// Everything the application form collects. Sent to the server as the student profile.
export type Profile = {
  name: string
  stage: string
  stageDetail: string
  interests: string
  goalType: string
  goal: string
  topic: string
  text: string
  files: File[]
  answers: Answers
  bands: Record<string, Band>
  likes: string[]
  notes: string
  hard: string
  // What Hermes understood about the student, as the student confirmed or edited it.
  about_you: string
}

export const emptyProfile: Profile = {
  name: '',
  stage: '',
  stageDetail: '',
  interests: '',
  goalType: '',
  goal: '',
  topic: '',
  text: '',
  files: [],
  answers: {},
  bands: {},
  likes: [],
  notes: '',
  hard: '',
  about_you: '',
}

// The stored values for each choice. Their display texts, in both languages, are in options.ts.
export const stages = Object.keys(optionMessages.en.stages)

export const goalTypes = Object.keys(optionMessages.en.goalTypes)

export const likeSuggestions = Object.keys(optionMessages.en.likes)

export type StepId =
  'about' | 'goal' | 'notes' | 'deck' | 'survey' | 'summary' | 'review'

// Step titles, in both languages, are in options.ts.
export const steps: { id: StepId }[] = [
  { id: 'about' },
  { id: 'goal' },
  { id: 'notes' },
  { id: 'deck' },
  { id: 'review' },
]

// One screen per step. The 30-question survey is optional, comes after the deck and gets one screen per category.
export type Screen = { step: StepId; categoryId?: string; minutes: number }

const surveyMinutes = 5

export function buildScreens(survey: Survey): Screen[] {
  return [
    { step: 'about', minutes: 1 },
    { step: 'goal', minutes: 2 },
    { step: 'notes', minutes: 1 },
    { step: 'deck', minutes: 1 },
    ...survey.categories.map((c) => ({
      step: 'survey' as const,
      categoryId: c.id,
      minutes: surveyMinutes / survey.categories.length,
    })),
    { step: 'summary', minutes: 0.5 },
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
