import type { Answers, Survey } from '@/lib/survey'
import type { Band } from './deck'

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

export const stages = [
  {
    value: 'Schule',
    detailLabel: 'In welcher Klasse bist du?',
    detailPlaceholder: 'z. B. Klasse 10',
  },
  {
    value: 'Ausbildung',
    detailLabel: 'Was lernst du in deiner Ausbildung?',
    detailPlaceholder: 'z. B. Elektroniker/in',
  },
  {
    value: 'Studium',
    detailLabel: 'Was studierst du?',
    detailPlaceholder: 'z. B. Biologie, 2. Semester',
  },
  {
    value: 'Etwas anderes',
    detailLabel: 'Erzähl uns ein bisschen mehr',
    detailPlaceholder: 'z. B. Spanisch-Abendkurs',
  },
]

export const goalTypes = [
  'Eine Prüfung bestehen',
  'Ein Thema verstehen',
  'Hausaufgaben schaffen',
  'Im Unterricht mithalten',
]

export const likeSuggestions = [
  'Kurze Videos',
  'Erst Beispiele',
  'Vorgelesener Text',
  'Quizfragen zum Testen',
  'Kleine Schritte mit Pausen',
  'Bilder und Diagramme',
  'Darüber reden',
  'Weniger Text auf dem Bildschirm',
]

export type StepId =
  'about' | 'goal' | 'notes' | 'deck' | 'survey' | 'summary' | 'review'

export const steps: { id: StepId; title: string }[] = [
  { id: 'about', title: 'Über dich' },
  { id: 'goal', title: 'Dein Ziel' },
  { id: 'notes', title: 'Deine Notizen' },
  { id: 'deck', title: 'Wie du lernst' },
  { id: 'review', title: 'Dein Profil prüfen' },
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
