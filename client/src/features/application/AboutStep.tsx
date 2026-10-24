import { Chip } from './Chip'
import { Input } from '@/components/ui/input'
import { defineMessages, useMessages } from '@/lib/i18n'
import { Field } from './Field'
import { entryFor, optionMessages } from './options'
import { StepHeading } from './StepHeading'
import { stages } from './profile'
import type { StepProps } from './ApplicationForm'

const messages = defineMessages({
  en: {
    label: 'About you',
    hint: 'Just the basics, so we know who we’re building for.',
    title: 'Who are we',
    titleEm: 'learning with?',
    name: 'What should we call you?',
    stage: 'Where do you learn right now?',
    interests: 'What are you into?',
    interestsHint:
      'Hobbies, games, sports, music. We use them for examples that make sense to you.',
    interestsPlaceholder: 'Football, Minecraft, drawing',
  },
  de: {
    label: 'Über dich',
    hint: 'Nur das Wichtigste, damit wir wissen, für wen wir bauen.',
    title: 'Mit wem',
    titleEm: 'lernen wir?',
    name: 'Wie sollen wir dich nennen?',
    stage: 'Wo lernst du gerade?',
    interests: 'Was interessiert dich?',
    interestsHint:
      'Hobbys, Games, Sport, Musik. Wir nutzen sie für Beispiele, die für dich Sinn ergeben.',
    interestsPlaceholder: 'Fußball, Minecraft, Zeichnen',
  },
})

function AboutStep({ profile, update, errors }: StepProps) {
  const t = useMessages(messages)
  const options = useMessages(optionMessages)
  const stage = entryFor(options.stages, profile.stage)

  return (
    <div>
      <StepHeading label={t.label} hint={t.hint}>
        {t.title} <em>{t.titleEm}</em>
      </StepHeading>

      <div className="flex flex-col gap-7">
        <Field id="name" label={t.name} error={errors.name}>
          <Input
            id="name"
            value={profile.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Lina"
            autoComplete="given-name"
            aria-invalid={!!errors.name}
            className="max-w-sm"
          />
        </Field>

        <Field label={t.stage} error={errors.stage}>
          <fieldset className="flex flex-wrap gap-2.5" aria-label={t.stage}>
            {stages.map((value) => (
              <Chip
                key={value}
                selected={profile.stage === value}
                onClick={() => update({ stage: value })}
              >
                {entryFor(options.stages, value)?.label ?? value}
              </Chip>
            ))}
          </fieldset>
        </Field>

        {stage && (
          <Field id="stage-detail" label={stage.detailLabel} optional>
            <Input
              id="stage-detail"
              value={profile.stageDetail}
              onChange={(e) => update({ stageDetail: e.target.value })}
              placeholder={stage.detailPlaceholder}
              className="max-w-sm"
            />
          </Field>
        )}

        <Field
          id="interests"
          label={t.interests}
          hint={t.interestsHint}
          optional
        >
          <Input
            id="interests"
            value={profile.interests}
            onChange={(e) => update({ interests: e.target.value })}
            placeholder={t.interestsPlaceholder}
          />
        </Field>
      </div>
    </div>
  )
}

export { AboutStep }
