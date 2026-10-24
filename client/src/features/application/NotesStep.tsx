import { Chip } from './Chip'
import { Textarea } from '@/components/ui/textarea'
import { Field } from './Field'
import { StepHeading } from './StepHeading'
import { likeSuggestions } from './profile'
import type { StepProps } from './ApplicationForm'

function NotesStep({ profile, update }: StepProps) {
  const toggle = (like: string) =>
    update({
      likes: profile.likes.includes(like)
        ? profile.likes.filter((l) => l !== like)
        : [...profile.likes, like],
    })

  return (
    <div>
      <StepHeading
        label="Your notes"
        hint="Anything you already know about how you learn. There are no wrong answers."
      >
        What works <em>for you?</em>
      </StepHeading>

      <div className="flex flex-col gap-7">
        <Field label="I like learning with…" hint="Pick as many as you like.">
          <fieldset
            className="flex flex-wrap gap-2.5"
            aria-label="I like learning with"
          >
            {likeSuggestions.map((like) => (
              <Chip
                key={like}
                selected={profile.likes.includes(like)}
                onClick={() => toggle(like)}
              >
                {like}
              </Chip>
            ))}
          </fieldset>
        </Field>

        <Field id="notes" label="Your own notes" optional>
          <Textarea
            id="notes"
            value={profile.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="I focus best in the evening. Long PDFs make me give up, but I can watch a 10 minute video without a problem."
            className="min-h-36"
          />
        </Field>
      </div>
    </div>
  )
}

export { NotesStep }
