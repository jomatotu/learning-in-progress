import type { ReactNode } from 'react'
import { deckBands, useSurvey } from '@/lib/survey'
import type { Profile } from './profile'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <span className="label mb-1 block">{label}</span>
      <div className="text-[0.92rem] break-words">{children}</div>
    </div>
  )
}

function Pending({ children }: { children: ReactNode }) {
  return <span className="text-sm text-graphite">{children}</span>
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="mr-1.5 mb-1.5 inline-block rounded-lg border border-pine bg-pine-soft px-2.5 py-0.5 text-[0.8rem] text-pine-deep">
      {children}
    </span>
  )
}

// Live summary next to each step, as a quiet column. Shows the student what we know so far.
function ProfilePanel({ profile }: { profile: Profile }) {
  const material = (profile.text.trim() ? 1 : 0) + profile.files.length
  const stage = [profile.stage, profile.stageDetail].filter(Boolean).join(' · ')
  const answered = Object.keys(profile.answers).length
  const survey = useSurvey()
  const mirrored = deckBands(survey, profile.bands, profile.answers).length
  const totalQuestions = survey.questions.length

  const content = (
    <>
      <div className="lg:sticky lg:top-8">
        <span className="label">Dein Lernprofil</span>
        <p className="mt-1 mb-4 text-[1.15rem] font-semibold">
          Das wissen wir bisher
        </p>

        <Row label="Du">
          {profile.name || stage ? (
            <p>{[profile.name, stage].filter(Boolean).join(' · ')}</p>
          ) : (
            <Pending>noch leer</Pending>
          )}
        </Row>
        <Row label="Ziel">
          {profile.goalType || profile.goal ? (
            <p>{profile.goalType || profile.goal}</p>
          ) : (
            <Pending>noch leer</Pending>
          )}
        </Row>
        <Row label="Thema">
          {profile.topic ? (
            <>
              <p>{profile.topic}</p>
              {material > 0 && (
                <p className="text-graphite">
                  {material} {material === 1 ? 'Eintrag' : 'Einträge'} Material
                </p>
              )}
            </>
          ) : (
            <Pending>noch leer</Pending>
          )}
        </Row>
        <Row label="Wie du lernst">
          {answered > 0 || mirrored > 0 ? (
            <>
              {mirrored > 0 && (
                <p>
                  {mirrored} von {survey.deck.length} Karten bestätigt
                </p>
              )}
              {answered > 0 && (
                <p>
                  {answered} von {totalQuestions} Fragen beantwortet
                </p>
              )}
            </>
          ) : (
            <Pending>noch leer</Pending>
          )}
        </Row>
        <Row label="Das klappt bei dir">
          {profile.likes.length > 0 || profile.notes || profile.hard ? (
            <>
              {profile.likes.map((like) => (
                <Tag key={like}>{like}</Tag>
              ))}
              {profile.hard && (
                <p className="line-clamp-2">Schwer: {profile.hard}</p>
              )}
              {profile.notes && <p className="line-clamp-2">{profile.notes}</p>}
            </>
          ) : (
            <Pending>noch leer</Pending>
          )}
        </Row>

        <p className="mt-4 border-l-[3px] border-pine pl-3 text-sm text-graphite">
          Du siehst hier alles und kannst alles ändern. Wir nutzen es nur, um
          deine Lösung zu bauen.
        </p>
      </div>
    </>
  )

  return (
    <>
      <aside
        aria-label="Dein Lernprofil"
        className="hidden min-w-0 border-l border-rule bg-sheet/60 px-6 py-5 break-words lg:block"
      >
        {content}
      </aside>
      <details className="border-t border-dashed border-rule px-5 py-3 md:px-8 lg:hidden">
        <summary className="cursor-pointer font-medium">Dein Profil</summary>
        <div className="pt-4">{content}</div>
      </details>
    </>
  )
}

export { ProfilePanel }
