import { Chip } from './Chip'
import { Textarea } from '@/components/ui/textarea'
import { defineMessages, useMessages } from '@/lib/i18n'
import { Field } from './Field'
import { labelFor, optionMessages } from './options'
import { StepHeading } from './StepHeading'
import { likeSuggestions } from './profile'
import type { StepProps } from './ApplicationForm'

const messages = defineMessages({
  en: {
    label: 'Your notes',
    hint: 'Anything you already know about how you learn. There are no wrong answers.',
    title: 'What works',
    titleEm: 'for you?',
    likes: 'I like learning with…',
    likesAria: 'I like learning with',
    likesHint: 'Pick as many as you like.',
    notes: 'Your own notes',
    notesPlaceholder:
      'I focus best in the evening. Long PDFs make me give up, but I can watch a 10 minute video without a problem.',
  },
  de: {
    label: 'Deine Notizen',
    hint: 'Alles, was du schon darüber weißt, wie du lernst. Es gibt keine falschen Antworten.',
    title: 'Was funktioniert',
    titleEm: 'für dich?',
    likes: 'Ich lerne gern mit…',
    likesAria: 'Ich lerne gern mit',
    likesHint: 'Wähl so viele, wie du willst.',
    notes: 'Deine eigenen Notizen',
    notesPlaceholder:
      'Ich konzentriere mich abends am besten. Bei langen PDFs gebe ich auf, aber ein 10-Minuten-Video schaue ich ohne Probleme.',
  },
})

function NotesStep({ profile, update }: StepProps) {
  const t = useMessages(messages)
  const options = useMessages(optionMessages)
  const toggle = (like: string) =>
    update({
      likes: profile.likes.includes(like)
        ? profile.likes.filter((l) => l !== like)
        : [...profile.likes, like],
    })

  return (
    <div>
      <StepHeading label={t.label} hint={t.hint}>
        {t.title} <em>{t.titleEm}</em>
      </StepHeading>

      <div className="flex flex-col gap-7">
        <Field label={t.likes} hint={t.likesHint}>
          <fieldset className="flex flex-wrap gap-2.5" aria-label={t.likesAria}>
            {likeSuggestions.map((like) => (
              <Chip
                key={like}
                selected={profile.likes.includes(like)}
                onClick={() => toggle(like)}
              >
                {labelFor(options.likes, like)}
              </Chip>
            ))}
          </fieldset>
        </Field>

        <Field id="notes" label={t.notes} optional>
          <Textarea
            id="notes"
            value={profile.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder={t.notesPlaceholder}
            className="min-h-36"
          />
        </Field>
      </div>
    </div>
  )
}

export { NotesStep }
