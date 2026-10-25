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
        label="Deine Notizen"
        hint="Alles, was du schon darüber weißt, wie du lernst. Es gibt keine falschen Antworten."
      >
        Was klappt <em>bei dir?</em>
      </StepHeading>

      <div className="flex flex-col gap-7">
        <Field
          label="Ich lerne gern mit…"
          hint="Such so viele aus, wie du magst."
        >
          <fieldset
            className="flex flex-wrap gap-2.5"
            aria-label="Ich lerne gern mit"
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

        <Field id="hard" label="Was macht Lernen gerade schwer?" optional>
          <Textarea
            id="hard"
            value={profile.hard}
            onChange={(e) => update({ hard: e.target.value })}
            placeholder="z. B. Ich fange nicht an, oder ich verliere mitten im Text den Faden."
          />
        </Field>

        <Field id="notes" label="Deine eigenen Notizen" optional>
          <Textarea
            id="notes"
            value={profile.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="z. B. Abends kann ich mich am besten konzentrieren. Lange PDFs lassen mich aufgeben, aber ein 10-Minuten-Video schaffe ich locker."
            className="min-h-36"
          />
        </Field>
      </div>
    </div>
  )
}

export { NotesStep }
