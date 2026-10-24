import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const options = [
  { id: 'large', label: 'Larger text' },
  { id: 'spaced', label: 'More spacing' },
  { id: 'calm', label: 'Calmer colours' },
] as const

type OptionId = (typeof options)[number]['id']

const storageKey = 'reading-comfort'

function loadChoice(): OptionId[] {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey) ?? '[]')
  } catch {
    return []
  }
}

// Lets the student adapt the page. Each option sets a data-comfort-* attribute that application.css reacts to.
function ReadingComfort() {
  const [active, setActive] = useState<OptionId[]>(loadChoice)

  useEffect(() => {
    for (const { id } of options) {
      document.documentElement.toggleAttribute(
        `data-comfort-${id}`,
        active.includes(id),
      )
    }
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(active))
    } catch {
      // Storage can be blocked; the setting still applies for this page.
    }
    // Leaving /application takes the settings off, so other pages keep their own look.
    return () => {
      for (const { id } of options) {
        document.documentElement.removeAttribute(`data-comfort-${id}`)
      }
    }
  }, [active])

  const toggle = (id: OptionId) =>
    setActive((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    )

  return (
    <fieldset
      aria-label="Reading comfort"
      className="flex items-center gap-1.5"
    >
      <span className="label mr-1 hidden md:inline">Reading comfort</span>
      {options.map(({ id, label }) => {
        const on = active.includes(id)
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[0.8rem] font-normal transition-colors',
              on
                ? 'border-ink bg-ink text-white'
                : 'border-rule bg-sheet hover:border-graphite',
            )}
          >
            {label}
          </button>
        )
      })}
    </fieldset>
  )
}

export { ReadingComfort }
