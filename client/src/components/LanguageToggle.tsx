import { cn } from '@/lib/utils'
import { defineMessages, useLanguage, useMessages, type Lang } from '@/lib/i18n'

const messages = defineMessages({
  en: { label: 'Language', names: { de: 'German', en: 'English' } },
  de: { label: 'Sprache', names: { de: 'Deutsch', en: 'Englisch' } },
})

const options: Lang[] = ['de', 'en']

// DE | EN switch for the top bar, in the main site's style.
export function LanguageToggle() {
  const { lang, setLang } = useLanguage()
  const t = useMessages(messages)

  return (
    <fieldset
      aria-label={t.label}
      className="flex rounded-full border border-[#d3d0c7] bg-white/60 p-0.5"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={lang === option}
          aria-label={t.names[option]}
          onClick={() => setLang(option)}
          className={cn(
            'rounded-full px-2.5 py-1 text-[12px] font-bold tracking-wide uppercase transition-colors',
            lang === option
              ? 'bg-[#292632] text-white'
              : 'text-[#686572] hover:text-[#6955c6]',
          )}
        >
          {option}
        </button>
      ))}
    </fieldset>
  )
}
