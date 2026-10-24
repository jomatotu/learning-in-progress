import type { Answer, Profile, ThemeName, ThemePick } from '@/api/assess'

// Everything the learn tab needs to generate the pages for one finished assessment.
export type LearnRun = {
  profile: Profile
  answers: Answer[]
  material: string
  themes: ThemePick[]
}

const PREFIX = 'lip-learn-'

// Hands the run to a new tab through localStorage, since a new tab doesn't share React state.
export function saveRun(run: LearnRun): string {
  const id = crypto.randomUUID()
  localStorage.setItem(PREFIX + id, JSON.stringify(run))
  return id
}

export function loadRun(id: string): LearnRun | undefined {
  const text = localStorage.getItem(PREFIX + id)
  return text ? JSON.parse(text) : undefined
}

// Keeps finished pages, so reloading the tab doesn't start new Hermes runs.
export function savePage(id: string, theme: ThemeName, html: string) {
  try {
    localStorage.setItem(`${PREFIX}${id}-${theme}`, html)
  } catch {
    // Storage full: the page still shows, it just isn't kept for a reload.
  }
}

export function loadPage(id: string, theme: ThemeName): string | null {
  return localStorage.getItem(`${PREFIX}${id}-${theme}`)
}
