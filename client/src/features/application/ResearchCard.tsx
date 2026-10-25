import { useEffect, useRef } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import type { StudentProfile } from '@/api/profile'
import { useResearch, type Research } from '@/api/research'
import { HermesProgress } from '@/components/HermesProgress'
import { defineMessages, useLanguage, useMessages, type Lang } from '@/lib/i18n'
import { TUTOR } from '@/lib/tutor'

const messages = defineMessages({
  en: {
    heading: `What ${TUTOR} researched for you`,
    searching: `${TUTOR} is searching the web for what is proven to help people like you. This takes a few minutes.`,
    stillBuilt: 'Your page will be built anyway.',
    more: 'Show more',
    less: 'Show less',
  },
  de: {
    heading: `Was ${TUTOR} für dich recherchiert`,
    searching: `${TUTOR} sucht im Web, was Menschen wie dir nachweislich hilft. Das dauert ein paar Minuten.`,
    stillBuilt: 'Deine Seite wird trotzdem gebaut.',
    more: 'Mehr zeigen',
    less: 'Weniger',
  },
})

// The summary and four strategies make five short lines; the rest waits behind "Mehr zeigen".
const SHORT_STRATEGIES = 4

function firstSentence(text: string, lang: Lang) {
  const [first] = new Intl.Segmenter(lang, { granularity: 'sentence' }).segment(
    text,
  )
  return first?.segment.trim() || text
}

// Hermes searches the web for what helps this student while they answer the questions next to it.
// Starts once per profile; the findings go into the page Hermes builds later.
function ResearchCard({
  profile,
  onDone,
}: {
  profile: StudentProfile
  onDone: (research: Research) => void
}) {
  const research = useResearch()
  const t = useMessages(messages)
  const { lang } = useLanguage()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    research.mutate(profile, { onSuccess: onDone })
  }, [profile, onDone, research])

  return (
    <section
      aria-labelledby="research-heading"
      className="rounded-2xl border border-rule bg-sheet p-5"
    >
      <h3 id="research-heading" className="flex items-center gap-2 font-medium">
        <Search className="size-4" aria-hidden />
        {t.heading}
      </h3>

      {research.isPending && (
        <>
          <p className="mt-2 text-sm text-graphite">{t.searching}</p>
          <HermesProgress
            status={research.status}
            reasoning={research.reasoning}
          />
        </>
      )}

      {research.isError && (
        <p
          role="alert"
          className="mt-2 border-l-[3px] border-clay pl-3 text-sm"
        >
          {research.error.message} {t.stillBuilt}
        </p>
      )}

      {research.data && (
        <>
          <p className="mt-2 text-sm">
            {firstSentence(research.data.summary, lang)}
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm">
            {research.data.findings.slice(0, SHORT_STRATEGIES).map((f) => (
              <li key={f.source_url + f.need}>
                {firstSentence(f.strategy, lang)}
              </li>
            ))}
          </ul>
          <details className="group mt-3 text-sm">
            <summary className="cursor-pointer text-pine-deep">
              <span className="group-open:hidden">{t.more}</span>
              <span className="hidden group-open:inline">{t.less}</span>
            </summary>
            <p className="mt-3">{research.data.summary}</p>
            <ul className="mt-3 flex flex-col gap-3">
              {research.data.findings.map((finding) => (
                <li key={finding.source_url + finding.need}>
                  <p className="font-medium">{finding.strategy}</p>
                  <p className="text-graphite">{finding.how_to_apply}</p>
                  <a
                    href={finding.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-pine-deep underline"
                  >
                    {finding.source_title}
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  )
}

export { ResearchCard }
