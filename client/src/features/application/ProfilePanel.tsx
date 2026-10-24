import type { ReactNode } from 'react'
import { defineMessages, useMessages } from '@/lib/i18n'
import { useSurvey } from '@/lib/survey'
import { entryFor, labelFor, optionMessages } from './options'
import type { Profile } from './profile'

const messages = defineMessages({
  en: {
    aria: 'Your learning profile',
    label: 'Your learning profile',
    title: 'What we know so far',
    you: 'You',
    goal: 'Goal',
    learning: 'Learning',
    howYouLearn: 'How you learn',
    worksForYou: 'Works for you',
    step: (n: number) => `Step ${n}`,
    material: (n: number) => `${n} ${n === 1 ? 'item' : 'items'} of material`,
    answered: (n: number, total: number) =>
      `${n} of ${total} questions answered`,
    note: 'You can see and change everything here. We only use it to build your tool.',
  },
  de: {
    aria: 'Dein Lernprofil',
    label: 'Dein Lernprofil',
    title: 'Was wir bisher wissen',
    you: 'Du',
    goal: 'Ziel',
    learning: 'Thema',
    howYouLearn: 'Wie du lernst',
    worksForYou: 'Was für dich passt',
    step: (n: number) => `Schritt ${n}`,
    material: (n: number) => `${n} ${n === 1 ? 'Material' : 'Materialien'}`,
    answered: (n: number, total: number) =>
      `${n} von ${total} Fragen beantwortet`,
    note: 'Du kannst hier alles sehen und ändern. Wir nutzen es nur, um dein Werkzeug zu bauen.',
  },
})

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
  const t = useMessages(messages)
  const options = useMessages(optionMessages)
  const material =
    profile.texts.length + profile.links.length + profile.files.length
  const stageLabel =
    entryFor(options.stages, profile.stage)?.label ?? profile.stage
  const stage = [stageLabel, profile.stageDetail].filter(Boolean).join(' · ')
  const answered = Object.keys(profile.answers).length
  const totalQuestions = useSurvey().questions.length

  return (
    <aside
      aria-label={t.aria}
      className="bg-[repeating-linear-gradient(var(--sheet)_0_31px,var(--pine-soft)_31px_32px)] p-8 md:p-10"
    >
      <div className="md:sticky md:top-8">
        <span className="label">{t.label}</span>
        <p className="mt-2 mb-6 text-[1.3rem] font-semibold">{t.title}</p>

        <Row label={t.you}>
          {profile.name || stage ? (
            <p>{[profile.name, stage].filter(Boolean).join(' · ')}</p>
          ) : (
            <Pending>{t.step(1)}</Pending>
          )}
        </Row>
        <Row label={t.goal}>
          {profile.goalType || profile.goal ? (
            <p>
              {profile.goalType
                ? labelFor(options.goalTypes, profile.goalType)
                : profile.goal}
            </p>
          ) : (
            <Pending>{t.step(2)}</Pending>
          )}
        </Row>
        <Row label={t.learning}>
          {profile.topic ? (
            <>
              <p>{profile.topic}</p>
              {material > 0 && (
                <p className="text-graphite">{t.material(material)}</p>
              )}
            </>
          ) : (
            <Pending>{t.step(2)}</Pending>
          )}
        </Row>
        <Row label={t.howYouLearn}>
          {answered > 0 ? (
            <p>{t.answered(answered, totalQuestions)}</p>
          ) : (
            <Pending>{t.step(3)}</Pending>
          )}
        </Row>
        <Row label={t.worksForYou}>
          {profile.likes.length > 0 || profile.notes ? (
            <>
              {profile.likes.map((like) => (
                <Tag key={like}>{labelFor(options.likes, like)}</Tag>
              ))}
              {profile.notes && <p className="line-clamp-2">{profile.notes}</p>}
            </>
          ) : (
            <Pending>{t.step(4)}</Pending>
          )}
        </Row>

        <p className="mt-8 border-l-[3px] border-pine pl-3 text-sm text-graphite">
          {t.note}
        </p>
      </div>
    </aside>
  )
}

export { ProfilePanel }
