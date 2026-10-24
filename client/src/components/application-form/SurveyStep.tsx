import { questionsIn, useSurvey, type SurveyCategory } from '@/lib/survey'
import { cn } from '@/lib/utils'
import { StepHeading } from './StepHeading'
import type { StepProps } from './ApplicationForm'

// One statement with five answer options, from "Not like me at all" to "Very much like me".
function RatingItem({
  id,
  text,
  value,
  onChange,
}: {
  id: string
  text: string
  value: number | undefined
  onChange: (value: number) => void
}) {
  const { min, labels } = useSurvey().response_scale

  return (
    <fieldset className="border-t-[1.5px] border-dashed border-rule pt-5 first:border-t-0 first:pt-0">
      <legend className="mb-3 font-normal">{text}</legend>
      <div className="grid grid-cols-5 gap-2">
        {labels.map((label, i) => {
          const option = min + i
          const checked = value === option
          return (
            <label
              key={label}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1 rounded-[14px] border-[1.5px] px-1 py-2.5 text-center transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-pine',
                checked
                  ? 'border-ink bg-marigold-soft'
                  : 'border-rule bg-paper hover:border-graphite',
              )}
            >
              <input
                type="radio"
                name={id}
                value={option}
                checked={checked}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              <span className="text-base font-medium">{option}</span>
              <span className="hidden text-[0.72rem] leading-tight text-graphite sm:block">
                {label}
              </span>
              <span className="sr-only sm:hidden">{label}</span>
            </label>
          )
        })}
      </div>
      <div
        className="mt-1.5 flex justify-between text-[0.75rem] text-graphite sm:hidden"
        aria-hidden
      >
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </fieldset>
  )
}

// One survey screen: the statements of a single category.
function SurveyStep({
  profile,
  update,
  errors,
  category,
  part,
}: StepProps & { category: SurveyCategory; part: number }) {
  const survey = useSurvey()

  return (
    <div>
      <StepHeading
        label={`How you learn · part ${part} of ${survey.categories.length}`}
        hint={category.hint}
      >
        {category.title}
      </StepHeading>

      <p className="-mt-4 mb-6 text-sm text-graphite">
        How much is each one like you? There are no right or wrong answers.
      </p>

      <div className="flex flex-col gap-5">
        {questionsIn(survey, category.id).map((item) => (
          <RatingItem
            key={item.id}
            id={item.id}
            text={item.text}
            value={profile.answers[item.id]}
            onChange={(value) =>
              update({ answers: { ...profile.answers, [item.id]: value } })
            }
          />
        ))}
      </div>

      {errors.answers && (
        <p
          role="alert"
          className="mt-5 border-l-[3px] border-clay pl-3 text-sm"
        >
          {errors.answers}
        </p>
      )}
    </div>
  )
}

export { SurveyStep }
