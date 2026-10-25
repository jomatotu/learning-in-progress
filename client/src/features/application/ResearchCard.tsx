import { useEffect, useRef } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import type { StudentProfile } from '@/api/profile'
import { useResearch, type Research } from '@/api/research'
import { HermesProgress } from '@/components/HermesProgress'
import { TUTOR } from '@/lib/tutor'

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
        Was {TUTOR} für dich recherchiert
      </h3>

      {research.isPending && (
        <>
          <p className="mt-2 text-sm text-graphite">
            {TUTOR} sucht im Web, was Menschen wie dir nachweislich hilft. Das
            dauert ein paar Minuten.
          </p>
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
          {research.error.message} Deine Seite wird trotzdem gebaut.
        </p>
      )}

      {research.data && (
        <>
          <p className="mt-2 text-sm">{research.data.summary}</p>
          <ul className="mt-3 flex flex-col gap-3">
            {research.data.findings.map((finding) => (
              <li key={finding.source_url + finding.need} className="text-sm">
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
        </>
      )}
    </section>
  )
}

export { ResearchCard }
