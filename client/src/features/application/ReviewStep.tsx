import type { ReactNode } from 'react'
import { useSurvey } from '@/lib/survey'
import { StepHeading } from './StepHeading'
import type { StepId } from './profile'
import type { StepProps } from './ApplicationForm'

function Section({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: ReactNode
}) {
  return (
    <section className="border-t border-dashed border-rule py-5 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="label font-sans">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-ink underline decoration-rule decoration-[1.5px] underline-offset-4 hover:decoration-ink"
        >
          Ändern
        </button>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-graphite">{children}</p>
}

function ReviewStep({
  profile,
  goTo,
}: StepProps & { goTo: (step: StepId) => void }) {
  const answered = Object.keys(profile.answers).length
  const questions = useSurvey().questions.length
  const material =
    profile.texts.length + profile.links.length + profile.files.length
  const stage = [profile.stage, profile.stageDetail].filter(Boolean).join(' · ')

  return (
    <div>
      <StepHeading
        label="Dein Profil prüfen"
        hint="Damit bauen wir dein Tool. Ändere alles, was nicht stimmt."
      >
        Klingt das <em>nach dir?</em>
      </StepHeading>

      <div className="rounded-2xl border border-rule bg-paper p-6">
        <Section title="Über dich" onEdit={() => goTo('about')}>
          <p className="font-normal">{profile.name}</p>
          {stage && <p className="text-graphite">{stage}</p>}
          {profile.interests && (
            <p className="text-graphite">Interessen: {profile.interests}</p>
          )}
        </Section>

        <Section title="Dein Ziel" onEdit={() => goTo('goal')}>
          {profile.goalType || profile.goal ? (
            <>
              {profile.goalType && (
                <p className="font-normal">{profile.goalType}</p>
              )}
              {profile.goal && <p>{profile.goal}</p>}
            </>
          ) : (
            <Empty>Noch kein Ziel</Empty>
          )}
          {profile.deadline && (
            <p className="text-graphite">
              Bis{' '}
              {new Date(profile.deadline).toLocaleDateString('de-DE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </Section>

        <Section title="Was du lernst" onEdit={() => goTo('goal')}>
          <p className="font-normal">{profile.topic}</p>
          <p className="text-graphite">
            {material === 0
              ? 'Noch kein Material hinzugefügt'
              : `${material} ${material === 1 ? 'Eintrag' : 'Einträge'} hinzugefügt`}
          </p>
        </Section>

        <Section title="Wie du lernst" onEdit={() => goTo('survey')}>
          <p>
            {answered === 0
              ? 'Übersprungen'
              : `${answered} von ${questions} Fragen beantwortet`}
          </p>
        </Section>

        <Section title="Deine Notizen" onEdit={() => goTo('notes')}>
          {profile.likes.length > 0 && (
            <ul
              className="mb-2 flex flex-wrap gap-1.5"
              aria-label="Du lernst gern mit"
            >
              {profile.likes.map((like) => (
                <li
                  key={like}
                  className="rounded-lg border border-pine bg-pine-soft px-2.5 py-0.5 text-sm text-pine-deep"
                >
                  {like}
                </li>
              ))}
            </ul>
          )}
          {profile.notes ? (
            <p className="whitespace-pre-line">{profile.notes}</p>
          ) : (
            !profile.likes.length && <Empty>Noch keine Notizen</Empty>
          )}
        </Section>
      </div>
    </div>
  )
}

export { ReviewStep }
