import { createContext, use } from 'react'

// The site's two languages. German is the default, matching the main site.
export type Lang = 'en' | 'de'

export const defaultLang: Lang = 'de'

export const LanguageContext = createContext<{
  lang: Lang
  setLang: (lang: Lang) => void
}>({ lang: defaultLang, setLang: () => {} })

export function useLanguage() {
  return use(LanguageContext)
}

// Keeps a component's texts next to it, in both languages. TypeScript checks that German has every English key.
export function defineMessages<T>(messages: { en: T; de: NoInfer<T> }) {
  return messages
}

export function useMessages<T>(messages: { en: T; de: T }): T {
  return messages[useLanguage().lang]
}
