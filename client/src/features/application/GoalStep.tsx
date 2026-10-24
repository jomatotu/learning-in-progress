import { Chip } from './Chip'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { defineMessages, useMessages } from '@/lib/i18n'
import { Field } from './Field'
import { MaterialInput } from './MaterialInput'
import { labelFor, optionMessages } from './options'
import { StepHeading } from './StepHeading'
import { goalTypes } from './profile'
import type { StepProps } from './ApplicationForm'

const messages = defineMessages({
  en: {
    label: 'Your goal',
    hint: 'What you want to reach, and the material you’re working with.',
    title: 'What are you',
    titleEm: 'working towards?',
    goalType: 'What’s the goal?',
    goal: 'Say it in your own words',
    goalPlaceholder:
      'Pass my biology exam and actually understand cell biology, not just memorise it',
    deadline: 'Is there a date you’re working towards?',
    topic: 'What are you learning?',
    topicPlaceholder: 'Cell biology: membranes and transport',
    material: 'Add your material',
    materialHint:
      'Anything you’re learning from. You can add as much as you like, or skip this for now.',
  },
  de: {
    label: 'Dein Ziel',
    hint: 'Was du erreichen willst, und das Material, mit dem du arbeitest.',
    title: 'Worauf',
    titleEm: 'arbeitest du hin?',
    goalType: 'Was ist das Ziel?',
    goal: 'Sag es in deinen eigenen Worten',
    goalPlaceholder:
      'Meine Bio-Prüfung bestehen und Zellbiologie wirklich verstehen, nicht nur auswendig lernen',
    deadline: 'Gibt es ein Datum, auf das du hinarbeitest?',
    topic: 'Was lernst du gerade?',
    topicPlaceholder: 'Zellbiologie: Membranen und Transport',
    material: 'Füg dein Material hinzu',
    materialHint:
      'Alles, womit du lernst. Du kannst so viel hinzufügen, wie du willst, oder es erst mal überspringen.',
  },
})

function GoalStep({ profile, update, errors }: StepProps) {
  const t = useMessages(messages)
  const options = useMessages(optionMessages)

  return (
    <div>
      <StepHeading label={t.label} hint={t.hint}>
        {t.title} <em>{t.titleEm}</em>
      </StepHeading>

      <div className="flex flex-col gap-7">
        <Field label={t.goalType}>
          <fieldset className="flex flex-wrap gap-2.5" aria-label={t.goalType}>
            {goalTypes.map((type) => (
              <Chip
                key={type}
                selected={profile.goalType === type}
                onClick={() =>
                  update({ goalType: profile.goalType === type ? '' : type })
                }
              >
                {labelFor(options.goalTypes, type)}
              </Chip>
            ))}
          </fieldset>
        </Field>

        <Field id="goal" label={t.goal} optional>
          <Textarea
            id="goal"
            value={profile.goal}
            onChange={(e) => update({ goal: e.target.value })}
            placeholder={t.goalPlaceholder}
            className="min-h-20"
          />
        </Field>

        <Field id="deadline" label={t.deadline} optional>
          <Input
            id="deadline"
            type="date"
            value={profile.deadline}
            onChange={(e) => update({ deadline: e.target.value })}
            className="max-w-56"
          />
        </Field>

        <hr className="border-t border-dashed border-rule" />

        <Field id="topic" label={t.topic} error={errors.topic}>
          <Input
            id="topic"
            value={profile.topic}
            onChange={(e) => update({ topic: e.target.value })}
            placeholder={t.topicPlaceholder}
            aria-invalid={!!errors.topic}
          />
        </Field>

        <Field label={t.material} hint={t.materialHint} optional>
          <MaterialInput profile={profile} update={update} />
        </Field>
      </div>
    </div>
  )
}

export { GoalStep }
