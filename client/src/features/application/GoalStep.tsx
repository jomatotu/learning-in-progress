import { Chip } from './Chip'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from './Field'
import { MaterialInput } from './MaterialInput'
import { StepHeading } from './StepHeading'
import { goalTypes } from './profile'
import type { StepProps } from './ApplicationForm'

function GoalStep({ profile, update, errors }: StepProps) {
  return (
    <div>
      <StepHeading
        label="Dein Ziel"
        hint="Was du erreichen willst und mit welchem Material du arbeitest."
      >
        Worauf <em>arbeitest du hin?</em>
      </StepHeading>

      <div className="flex flex-col gap-7">
        <Field label="Was ist dein Ziel?">
          <fieldset
            className="flex flex-wrap gap-2.5"
            aria-label="Was ist dein Ziel?"
          >
            {goalTypes.map((type) => (
              <Chip
                key={type}
                selected={profile.goalType === type}
                onClick={() =>
                  update({ goalType: profile.goalType === type ? '' : type })
                }
              >
                {type}
              </Chip>
            ))}
          </fieldset>
        </Field>

        <Field id="goal" label="Sag es in deinen eigenen Worten" optional>
          <Textarea
            id="goal"
            value={profile.goal}
            onChange={(e) => update({ goal: e.target.value })}
            placeholder="z. B. Meine Bio-Prüfung bestehen und die Zellbiologie wirklich verstehen, nicht nur auswendig lernen"
            className="min-h-20"
          />
        </Field>

        <Field
          id="deadline"
          label="Gibt es einen Termin, auf den du hinarbeitest?"
          optional
        >
          <Input
            id="deadline"
            type="date"
            value={profile.deadline}
            onChange={(e) => update({ deadline: e.target.value })}
            className="max-w-56"
          />
        </Field>

        <hr className="border-t border-dashed border-rule" />

        <Field id="topic" label="Was lernst du gerade?" error={errors.topic}>
          <Input
            id="topic"
            value={profile.topic}
            onChange={(e) => update({ topic: e.target.value })}
            placeholder="z. B. Zellbiologie: Membranen und Transport"
            aria-invalid={!!errors.topic}
          />
        </Field>

        <Field
          label="Füg dein Material hinzu"
          hint="Alles, womit du lernst. Du kannst so viel hinzufügen, wie du magst, oder das erstmal überspringen."
          optional
        >
          <MaterialInput profile={profile} update={update} />
        </Field>
      </div>
    </div>
  )
}

export { GoalStep }
