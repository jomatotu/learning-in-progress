import { useEffect, useState, type ReactNode } from 'react'
import { defaultLang, LanguageContext, type Lang } from '@/lib/i18n'

const storageKey = 'language'

function loadLang(fallback: Lang): Lang {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved === 'en' || saved === 'de' ? saved : fallback
  } catch {
    return fallback
  }
}

// Holds the chosen language for the whole site and remembers it between visits.
export function LanguageProvider({
  initial = defaultLang,
  children,
}: {
  initial?: Lang
  children: ReactNode
}) {
  const [lang, setLang] = useState<Lang>(() => loadLang(initial))

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(storageKey, lang)
    } catch {
      // Storage can be blocked; the choice still applies until the page reloads.
    }
  }, [lang])

  return <LanguageContext value={{ lang, setLang }}>{children}</LanguageContext>
}
