import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  fetchSurvey,
  questionsIn,
  SurveyContext,
  useSurvey,
  type Survey,
} from '@/lib/survey'
import { cn } from '@/lib/utils'
import { AboutStep } from './AboutStep'
import { createProfile, type StudentProfileJson } from './studentProfile'
import { FinishedScreen } from './FinishedScreen'
import { GoalStep } from './GoalStep'
import { NotesStep } from './NotesStep'
import { ProfilePanel } from './ProfilePanel'
import { ReviewStep } from './ReviewStep'
import { SurveyStep } from './SurveyStep'
import { WelcomeStep } from './WelcomeStep'
import {
  buildScreens,
  loadProfile,
  saveProfile,
  steps,
  type Profile,
  type Screen,
  type StepId,
} from './profile'

type ProfileResult =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'ready'; data: StudentProfileJson }

export type StepProps = {
  profile: Profile
  update: (patch: Partial<Profile>) => void
  errors: Partial<Record<keyof Profile, string>>
}

// Returns what's missing before the student can leave this screen.
function validate(
  screen: Screen,
  profile: Profile,
  survey: Survey,
): StepProps['errors'] {
  if (screen.step === 'about') {
    return {
      ...(!profile.name.trim() && { name: 'Tell us what to call you.' }),
      ...(!profile.stage && { stage: 'Pick the one that fits best.' }),
    }
  }
  if (screen.step === 'goal' && !profile.topic.trim()) {
    return { topic: 'Tell us the topic, even in a few words.' }
  }
  if (screen.step === 'survey') {
    const missing = questionsIn(survey, screen.categoryId).some(
      (question) => profile.answers[question.id] === undefined,
    )
    if (missing) {
      return { answers: 'Answer each one, or skip this part for now.' }
    }
  }
  return {}
}

const primaryLabel: Record<StepId, string> = {
  welcome: 'Let’s start',
  about: 'Continue',
  goal: 'Continue',
  survey: 'Continue',
  notes: 'Continue',
  review: 'Build my tool',
}

// The intake flow: welcome, about you, your goal, the learning survey, your notes, and a final check.
function Form() {
  const survey = useSurvey()
  const screens = buildScreens(survey)
  const [index, setIndex] = useState(0)
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const [errors, setErrors] = useState<StepProps['errors']>({})
  const [finished, setFinished] = useState(false)
  const [result, setResult] = useState<ProfileResult>({ status: 'idle' })
  const panel = useRef<HTMLDivElement>(null)

  const screen = screens[index]
  const step = steps.find((s) => s.id === screen.step)!
  const counted = steps.slice(1)
  const stepNumber = counted.findIndex((s) => s.id === screen.step) + 1
  const minutesLeft = Math.ceil(
    screens.slice(index).reduce((sum, s) => sum + s.minutes, 0),
  )
  const category = survey.categories.find((c) => c.id === screen.categoryId)
  const part =
    survey.categories.findIndex((c) => c.id === screen.categoryId) + 1

  useEffect(() => saveProfile(profile), [profile])

  // Move focus to the new question so keyboard and screen reader users start at the top.
  const shownScreen = useRef(`${index}-${finished}`)
  useEffect(() => {
    if (shownScreen.current === `${index}-${finished}`) return
    shownScreen.current = `${index}-${finished}`
    panel.current?.querySelector('h2')?.focus({ preventScroll: true })
    panel.current?.scrollIntoView?.({ block: 'start' })
  }, [index, finished])

  const update = (patch: Partial<Profile>) => {
    setProfile((current) => ({ ...current, ...patch }))
    // Editing a field clears its error.
    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => !(key in patch)),
      ),
    )
  }

  // "Build my tool": the server scores the survey and returns the student's profile JSON.
  const buildProfile = () => {
    setResult({ status: 'loading' })
    createProfile(profile).then(
      (data) => {
        setResult({ status: 'ready', data })
        setFinished(true)
      },
      () => setResult({ status: 'error' }),
    )
  }

  const moveTo = (target: number) => {
    setErrors({})
    setResult({ status: 'idle' })
    setIndex(target)
  }

  const goTo = (id: StepId) => moveTo(screens.findIndex((s) => s.step === id))

  const next = () => {
    const found = validate(screen, profile, survey)
    setErrors(found)
    if (Object.keys(found).length) return
    if (screen.step !== 'review') moveTo(index + 1)
    else if (result.status !== 'loading') buildProfile()
  }

  const stepProps = { profile, update, errors }
  const showPanel = ['about', 'goal', 'notes'].includes(screen.step)
  const canSkip = screen.step === 'survey' || screen.step === 'notes'

  if (finished && result.status === 'ready') {
    return (
      <div ref={panel}>
        <FinishedScreen
          name={profile.name}
          profileJson={result.data}
          onBack={() => setFinished(false)}
        />
      </div>
    )
  }

  return (
    <div
      ref={panel}
      className="overflow-hidden rounded-[22px] border-[1.5px] border-ink bg-sheet shadow-hard-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b-[1.5px] border-rule px-6 py-4 text-sm md:px-8">
        <span>
          {screen.step === 'welcome' ? (
            <span className="font-medium">Your learning profile</span>
          ) : (
            <>
              <span className="font-medium">
                Step {stepNumber} of {counted.length}
              </span>{' '}
              · {step.title}
            </>
          )}
          <span className="text-graphite">
            {' '}
            ·{' '}
            {minutesLeft > 0
              ? `about ${minutesLeft} ${minutesLeft === 1 ? 'minute' : 'minutes'} left`
              : 'almost done'}
          </span>
        </span>
        <div className="flex gap-1.5" aria-hidden>
          {counted.map((s, i) => (
            <i
              key={s.id}
              className={cn(
                'h-1.5 w-9 rounded-full',
                i + 1 < stepNumber
                  ? 'bg-pine'
                  : i + 1 === stepNumber
                    ? 'bg-marigold'
                    : 'bg-rule',
              )}
            />
          ))}
        </div>
        <span className="text-graphite">Saved</span>
      </div>

      <div className={cn('grid', showPanel && 'md:grid-cols-[1.45fr_1fr]')}>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            next()
          }}
          className={cn(
            'p-6 md:p-10 [&_h2]:outline-none',
            showPanel &&
              'border-b-[1.5px] border-dashed border-rule md:border-r-[1.5px] md:border-b-0',
            screen.step === 'survey' && 'mx-auto w-full max-w-3xl',
          )}
        >
          {screen.step === 'welcome' && <WelcomeStep />}
          {screen.step === 'about' && <AboutStep {...stepProps} />}
          {screen.step === 'goal' && <GoalStep {...stepProps} />}
          {screen.step === 'survey' && category && (
            <SurveyStep {...stepProps} category={category} part={part} />
          )}
          {screen.step === 'notes' && <NotesStep {...stepProps} />}
          {screen.step === 'review' && (
            <ReviewStep {...stepProps} goTo={goTo} />
          )}

          {result.status === 'error' && (
            <p
              role="alert"
              className="mt-8 border-l-[3px] border-clay pl-3 text-sm"
            >
              We couldn’t build your profile. Check your connection and try
              again.
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            {index > 0 ? (
              <Button
                type="button"
                variant="ghost"
                className="px-0 text-base"
                onClick={() => moveTo(index - 1)}
              >
                <ArrowLeft data-icon="inline-start" aria-hidden />
                Back
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-5">
              {canSkip && (
                <Button
                  type="button"
                  variant="ghost"
                  className="px-0 text-base"
                  onClick={() => moveTo(index + 1)}
                >
                  {screen.step === 'survey' ? 'Skip this part' : 'Skip for now'}
                </Button>
              )}
              <Button type="submit" size="lg">
                {result.status === 'loading'
                  ? 'Building…'
                  : primaryLabel[screen.step]}
                <ArrowRight data-icon="inline-end" aria-hidden />
              </Button>
            </div>
          </div>
        </form>

        {showPanel && <ProfilePanel profile={profile} />}
      </div>
    </div>
  )
}

type SurveyLoad =
  { status: 'loading' | 'error' } | { status: 'ready'; survey: Survey }

// Loads the survey questions from the server before showing the form.
function ApplicationForm() {
  const [load, setLoad] = useState<SurveyLoad>({ status: 'loading' })

  const loadSurvey = () => {
    setLoad({ status: 'loading' })
    fetchSurvey().then(
      (survey) => setLoad({ status: 'ready', survey }),
      () => setLoad({ status: 'error' }),
    )
  }

  // Runs once on mount; loadSurvey only sets state.
  // oxlint-disable-next-line react/exhaustive-deps
  useEffect(loadSurvey, [])

  if (load.status === 'ready') {
    return (
      <SurveyContext value={load.survey}>
        <Form />
      </SurveyContext>
    )
  }

  return (
    <div className="rounded-[22px] border-[1.5px] border-ink bg-sheet p-8 shadow-hard-lg md:p-14">
      {load.status === 'loading' ? (
        <p className="text-graphite">Getting things ready…</p>
      ) : (
        <div role="alert">
          <p>We couldn’t load the form. Check your connection and try again.</p>
          <Button
            variant="ghost"
            className="mt-4 px-0 text-base"
            onClick={loadSurvey}
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}

export { ApplicationForm }
