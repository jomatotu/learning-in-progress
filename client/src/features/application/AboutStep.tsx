import { Chip } from './Chip'
import { Input } from '@/components/ui/input'
import { Field } from './Field'
import { StepHeading } from './StepHeading'
import { stages } from './profile'
import type { StepProps } from './ApplicationForm'

function AboutStep({ profile, update, errors }: StepProps) {
  const stage = stages.find((s) => s.value === profile.stage)

  return (
    <div>
      <StepHeading
        label="Über dich"
        hint="Nur das Wichtigste, damit wir wissen, für wen wir bauen."
      >
        Mit wem <em>lernen wir?</em>
      </StepHeading>

      <div className="flex flex-col gap-7">
        <Field
          id="name"
          label="Wie sollen wir dich nennen?"
          error={errors.name}
        >
          <Input
            id="name"
            value={profile.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="z. B. Lina"
            autoComplete="given-name"
            aria-invalid={!!errors.name}
            className="max-w-sm"
          />
        </Field>

        <Field label="Wo lernst du gerade?" error={errors.stage}>
          <fieldset
            className="flex flex-wrap gap-2.5"
            aria-label="Wo lernst du gerade?"
          >
            {stages.map((s) => (
              <Chip
                key={s.value}
                selected={profile.stage === s.value}
                onClick={() => update({ stage: s.value })}
              >
                {s.value}
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
          label="Wofür interessierst du dich?"
          hint="Hobbys, Spiele, Sport, Musik. Damit machen wir Beispiele, die zu dir passen."
          optional
        >
          <Input
            id="interests"
            value={profile.interests}
            onChange={(e) => update({ interests: e.target.value })}
            placeholder="z. B. Fußball, Minecraft, Zeichnen"
          />
        </Field>
      </div>
    </div>
  )
}

export { AboutStep }
