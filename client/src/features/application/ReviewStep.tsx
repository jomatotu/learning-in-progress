import type { ReactNode } from 'react'
import { defineMessages, useMessages } from '@/lib/i18n'
import { deckBands, useSurvey } from '@/lib/survey'
import { entryFor, labelFor, optionMessages } from './options'
import { StepHeading } from './StepHeading'
import type { StepId } from './profile'
import type { StepProps } from './ApplicationForm'

const messages = defineMessages({
  en: {
    label: 'Check your profile',
    hint: 'This is what we’ll use to build your tool. Change anything that isn’t right.',
    title: 'Does this',
    titleEm: 'sound like you?',
    edit: 'Edit',
    about: 'About you',
    into: (interests: string) => `Into ${interests}`,
    goal: 'Your goal',
    noGoal: 'No goal yet',
    learning: 'What you’re learning',
    noMaterial: 'No material added yet',
    material: (n: number) => `${n} ${n === 1 ? 'item' : 'items'} added`,
    howYouLearn: 'How you learn',
    skipped: 'Skipped',
    answered: (n: number, total: number) =>
      `${n} of ${total} questions answered`,
    notes: 'Your notes',
    likesAria: 'You like learning with',
    noNotes: 'No notes yet',
    more: 'More detail? 30 short questions',
    understood: 'What I understood',
    hard: 'Hard: ',
  },
  de: {
    label: 'Profil prüfen',
    hint: 'Damit bauen wir dein Werkzeug. Ändere alles, was nicht stimmt.',
    title: 'Klingt das',
    titleEm: 'nach dir?',
    edit: 'Ändern',
    about: 'Über dich',
    into: (interests: string) => `Interessiert an ${interests}`,
    goal: 'Dein Ziel',
    noGoal: 'Noch kein Ziel',
    learning: 'Was du lernst',
    noMaterial: 'Noch kein Material hinzugefügt',
    material: (n: number) =>
      `${n} ${n === 1 ? 'Material' : 'Materialien'} hinzugefügt`,
    howYouLearn: 'Wie du lernst',
    skipped: 'Übersprungen',
    answered: (n: number, total: number) =>
      `${n} von ${total} Fragen beantwortet`,
    notes: 'Deine Notizen',
    likesAria: 'Du lernst gern mit',
    noNotes: 'Noch keine Notizen',
    more: 'Genauer? 30 kurze Fragen',
    understood: 'Das habe ich verstanden',
    hard: 'Schwer: ',
  },
})

function Section({
  title,
  onEdit,
  wide,
  children,
}: {
  title: string
  wide?: boolean
  onEdit: () => void
  children: ReactNode
}) {
  const t = useMessages(messages)

  return (
    <section
      data-wide={wide}
      className="border-t border-dashed border-rule py-1.5 first:border-t-0 first:pt-0 data-[wide=true]:md:col-span-2 md:[&:nth-child(2)]:border-t-0 md:[&:nth-child(2)]:pt-0 lg:[&:nth-child(3)]:border-t-0 lg:[&:nth-child(3)]:pt-0"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="label font-sans">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-ink underline decoration-rule decoration-[1.5px] underline-offset-4 hover:decoration-ink"
        >
          {t.edit}
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
  const survey = useSurvey()
  const t = useMessages(messages)
  const options = useMessages(optionMessages)
  const answered = Object.keys(profile.answers).length
  const questions = survey.questions.length
  const active = deckBands(survey, profile.bands, profile.answers)
  const mirrored = survey.deck.flatMap((entry) =>
    active.includes(entry.category)
      ? [
          {
            category: entry.category,
            text: entry[profile.bands[entry.category]].text,
          },
        ]
      : [],
  )
  const material = (profile.text.trim() ? 1 : 0) + profile.files.length
  const stageLabel =
    entryFor(options.stages, profile.stage)?.label ?? profile.stage
  const stage = [stageLabel, profile.stageDetail].filter(Boolean).join(' · ')

  return (
    <div>
      <StepHeading label={t.label} hint={t.hint}>
        {t.title} <em>{t.titleEm}</em>
      </StepHeading>

      <div className="grid border-t border-rule pt-2 md:grid-flow-dense md:grid-cols-2 md:gap-x-8 lg:grid-cols-3">
        <Section title={t.about} onEdit={() => goTo('about')}>
          <p className="font-normal">{profile.name}</p>
          {stage && <p className="text-graphite">{stage}</p>}
          {profile.interests && (
            <p className="text-graphite">{t.into(profile.interests)}</p>
          )}
        </Section>

        <Section title={t.goal} onEdit={() => goTo('goal')}>
          {profile.goalType || profile.goal ? (
            <>
              {profile.goalType && (
                <p className="font-normal">
                  {labelFor(options.goalTypes, profile.goalType)}
                </p>
              )}
              {profile.goal && <p>{profile.goal}</p>}
            </>
          ) : (
            <Empty>{t.noGoal}</Empty>
          )}
        </Section>

        <Section title={t.learning} onEdit={() => goTo('goal')}>
          <p className="font-normal">{profile.topic}</p>
          <p className="text-graphite">
            {material === 0 ? t.noMaterial : t.material(material)}
          </p>
        </Section>

        <Section wide title={t.howYouLearn} onEdit={() => goTo('deck')}>
          {mirrored.length > 0 && (
            <ul className="mb-2 flex flex-col gap-1.5 md:block md:columns-2 md:[&>li]:mb-1.5">
              {mirrored.map(({ category, text }) => (
                <li key={category} className="[overflow-wrap:anywhere]">
                  {text}
                </li>
              ))}
            </ul>
          )}
          {answered > 0 && (
            <p className="text-graphite">{t.answered(answered, questions)}</p>
          )}
          {answered === 0 && mirrored.length === 0 && <p>{t.skipped}</p>}
          <button
            type="button"
            onClick={() => goTo('survey')}
            className="text-button mt-1 pl-0"
          >
            {t.more}
          </button>
        </Section>

        {profile.about_you && (
          <Section wide title={t.understood} onEdit={() => goTo('summary')}>
            <p className="[overflow-wrap:anywhere] whitespace-pre-line">
              {profile.about_you}
            </p>
          </Section>
        )}

        <Section title={t.notes} onEdit={() => goTo('notes')}>
          {profile.hard && (
            <p className="mb-2 whitespace-pre-line">
              <span className="text-graphite">{t.hard}</span>
              {profile.hard}
            </p>
          )}
          {profile.likes.length > 0 && (
            <ul
              className="mb-2 flex flex-wrap gap-1.5"
              aria-label={t.likesAria}
            >
              {profile.likes.map((like) => (
                <li
                  key={like}
                  className="rounded-lg border border-pine bg-pine-soft px-2.5 py-0.5 text-sm text-pine-deep"
                >
                  {labelFor(options.likes, like)}
                </li>
              ))}
            </ul>
          )}
          {profile.notes ? (
            <p className="whitespace-pre-line">{profile.notes}</p>
          ) : (
            !profile.likes.length &&
            !profile.hard && <Empty>{t.noNotes}</Empty>
          )}
        </Section>
      </div>
    </div>
  )
}

export { ReviewStep }
