import type { ReactNode } from 'react'
import { useSurvey } from '@/lib/survey'
import type { Profile } from './profile'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <span className="label mb-1 block">{label}</span>
      <div className="text-[0.92rem]">{children}</div>
    </div>
  )
}

function Pending({ children }: { children: ReactNode }) {
  return (
    <span className="border-b border-dashed border-graphite text-sm text-graphite">
      {children}
    </span>
  )
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="mr-1.5 mb-1.5 inline-block rounded-lg border border-pine bg-pine-soft px-2.5 py-0.5 text-[0.8rem] text-pine-deep">
      {children}
    </span>
  )
}

// Live summary next to each step, on ruled notebook paper. Shows the student what we know so far.
function ProfilePanel({ profile }: { profile: Profile }) {
  const material =
    profile.texts.length + profile.links.length + profile.files.length
  const stage = [profile.stage, profile.stageDetail].filter(Boolean).join(' · ')
  const answered = Object.keys(profile.answers).length
  const mirrored = Object.keys(profile.bands).length
  const totalQuestions = useSurvey().questions.length

  return (
    <aside
      aria-label="Dein Lernprofil"
      className="bg-[repeating-linear-gradient(var(--sheet)_0_31px,var(--pine-soft)_31px_32px)] p-8 md:p-10"
    >
      <div className="md:sticky md:top-8">
        <span className="label">Dein Lernprofil</span>
        <p className="mt-2 mb-6 text-[1.3rem] font-semibold">
          Das wissen wir bisher
        </p>

        <Row label="Du">
          {profile.name || stage ? (
            <p>{[profile.name, stage].filter(Boolean).join(' · ')}</p>
          ) : (
            <Pending>Schritt 1</Pending>
          )}
        </Row>
        <Row label="Ziel">
          {profile.goalType || profile.goal ? (
            <p>{profile.goalType || profile.goal}</p>
          ) : (
            <Pending>Schritt 2</Pending>
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
            <Pending>Schritt 2</Pending>
          )}
        </Row>
        <Row label="Wie du lernst">
          {answered > 0 || mirrored > 0 ? (
            <>
              {mirrored > 0 && <p>{mirrored} von 8 Karten bestätigt</p>}
              {answered > 0 && (
                <p>
                  {answered} von {totalQuestions} Fragen beantwortet
                </p>
              )}
            </>
          ) : (
            <Pending>Schritt 4</Pending>
          )}
        </Row>
        <Row label="Das klappt bei dir">
          {profile.likes.length > 0 || profile.notes || profile.hard ? (
            <>
              {profile.likes.map((like) => (
                <Tag key={like}>{like}</Tag>
              ))}
              {profile.notes && <p className="line-clamp-2">{profile.notes}</p>}
            </>
          ) : (
            <Pending>Schritt 3</Pending>
          )}
        </Row>

        <p className="mt-8 border-l-[3px] border-pine pl-3 text-sm text-graphite">
          Du siehst hier alles und kannst alles ändern. Wir nutzen es nur, um
          dein Tool zu bauen.
        </p>
      </div>
    </aside>
  )
}

export { ProfilePanel }
