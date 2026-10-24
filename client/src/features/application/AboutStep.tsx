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
        label="About you"
        hint="Just the basics, so we know who we’re building for."
      >
        Who are we <em>learning with?</em>
      </StepHeading>

      <div className="flex flex-col gap-7">
        <Field id="name" label="What should we call you?" error={errors.name}>
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

        <Field label="Where do you learn right now?" error={errors.stage}>
          <fieldset
            className="flex flex-wrap gap-2.5"
            aria-label="Where do you learn right now?"
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
          label="What are you into?"
          hint="Hobbies, games, sports, music. We use them for examples that make sense to you."
          optional
        >
          <Input
            id="interests"
            value={profile.interests}
            onChange={(e) => update({ interests: e.target.value })}
            placeholder="Football, Minecraft, drawing"
          />
        </Field>
      </div>
    </div>
  )
}

export { AboutStep }
