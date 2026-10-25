import type { Answer, Profile, ThemeName, ThemePick } from '@/api/assess'
import type { BuiltPage, PageFormat } from '@/api/generate'

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

function pageKey(id: string, theme: ThemeName, format: PageFormat): string {
  return `${PREFIX}${id}-${theme}${format === 'html' ? '-html' : ''}`
}

// Keeps finished lessons and pages, so reloading the tab doesn't start new Hermes runs.
export function savePage(id: string, theme: ThemeName, page: BuiltPage) {
  try {
    const format = 'html' in page ? 'html' : 'spec'
    localStorage.setItem(pageKey(id, theme, format), JSON.stringify(page))
  } catch {
    // Storage full: the page still shows, it just isn't kept for a reload.
  }
}

// The saved lesson or page in this format; null for none, and for raw HTML saved before pages were JSON.
export function loadPage(
  id: string,
  theme: ThemeName,
  format: PageFormat,
): BuiltPage | null {
  try {
    const page: unknown = JSON.parse(
      localStorage.getItem(pageKey(id, theme, format)) ?? 'null',
    )
    return page && typeof page === 'object' && format in page
      ? (page as BuiltPage)
      : null
  } catch {
    return null
  }
}
