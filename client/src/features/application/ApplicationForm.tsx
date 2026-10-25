import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { useCreateProfile } from '@/api/profile'
import { useSurveyQuestions } from '@/api/survey'
import {
  deckBands,
  questionsIn,
  SurveyContext,
  useSurvey,
  type Survey,
} from '@/lib/survey'
import {
  requestCards,
  requestSummary,
  type CardAnswer,
  type HermesCard,
} from '@/api/intake'
import { cn } from '@/lib/utils'
import { AboutStep } from './AboutStep'
import { AssessmentScreen } from './AssessmentScreen'
import { DeckStep } from './DeckStep'
import { toIntakeBody, toProfileRequest } from './studentProfile'
import { GoalStep } from './GoalStep'
import { MagicStep } from './MagicStep'
import { NotesStep } from './NotesStep'
import { ProfilePanel } from './ProfilePanel'
import { ReviewStep } from './ReviewStep'
import { SummaryStep } from './SummaryStep'
import { SurveyStep } from './SurveyStep'
import {
  buildScreens,
  loadProfile,
  saveProfile,
  steps,
  type Profile,
  type Screen,
  type StepId,
} from './profile'

type Ending = 'assess' | 'magic'

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
      ...(!profile.name.trim() && {
        name: 'Sag uns, wie wir dich nennen sollen.',
      }),
      ...(!profile.stage && { stage: 'Wähl aus, was am besten passt.' }),
    }
  }
  if (screen.step === 'goal' && !profile.topic.trim()) {
    return { topic: 'Sag uns das Thema, auch in ein paar Wörtern.' }
  }
  if (screen.step === 'survey') {
    const missing = questionsIn(survey, screen.categoryId).some(
      (question) => profile.answers[question.id] === undefined,
    )
    if (missing) {
      return { answers: 'Beantworte jede Aussage oder überspring diesen Teil.' }
    }
  }
  return {}
}

// The intake flow: about you, your goal, your notes, the yes/no deck (with the optional 30-question survey), and a final check.
function Form() {
  const survey = useSurvey()
  const screens = buildScreens(survey)
  const [index, setIndex] = useState(0)
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const [errors, setErrors] = useState<StepProps['errors']>({})
  // Set when the student edits about/goal/notes from the review: "Weiter" then goes straight back.
  const [returnToReview, setReturnToReview] = useState(false)
  const [finished, setFinished] = useState(false)
  // Which flow runs after the profile is built: our assessment, or the Magic page.
  const [ending, setEnding] = useState<Ending>('assess')
  const createProfile = useCreateProfile()
  const panel = useRef<HTMLDivElement>(null)
  // Hermes's cards, requested once when the student leaves the notes. Late, empty or failed: the deck ends as before.
  const [hermes, setHermes] = useState<{
    token: string
    cards: HermesCard[]
  } | null>(null)
  const [cardAnswers, setCardAnswers] = useState<CardAnswer[]>([])
  const cardsAsked = useRef(false)
  const summaryAsked = useRef<{
    key: string
    promise: Promise<string | null>
  } | null>(null)

  const screen = screens[index]
  // The optional survey counts as part of the "Wie du lernst" step.
  const stepId =
    screen.step === 'survey' || screen.step === 'summary' ? 'deck' : screen.step
  const step = steps.find((s) => s.id === stepId)!
  const stepNumber = steps.findIndex((s) => s.id === stepId) + 1
  const minutesLeft = Math.ceil(
    screens
      .slice(index)
      .filter((s) => s.step !== 'survey' || screen.step === 'survey')
      .reduce((sum, s) => sum + s.minutes, 0),
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

  // "Meine Lösung bauen" and "Magic-Seite": the server scores the survey and returns the student's profile JSON.
  const buildProfile = (target: Ending) => {
    if (createProfile.isPending) return
    setEnding(target)
    createProfile.mutate(toProfileRequest(profile), {
      onSuccess: () => setFinished(true),
    })
  }

  const moveTo = (target: number) => {
    setErrors({})
    createProfile.reset()
    setReturnToReview(false)
    setIndex(target)
  }

  // Without cards there is no summary: the summary step is skipped in both directions.
  const goTo = (id: StepId) => {
    const target = id === 'summary' && !hermes ? 'review' : id
    moveTo(screens.findIndex((s) => s.step === target))
  }

  const startCards = () => {
    if (cardsAsked.current) return
    cardsAsked.current = true
    requestCards(toIntakeBody(profile)).then(
      ({ token, cards }) => {
        if (token) {
          setHermes({ token, cards: Array.isArray(cards) ? cards : [] })
        }
      },
      () => {},
    )
  }

  const summaryBody = {
    token: hermes?.token ?? '',
    bands: Object.fromEntries(
      deckBands(survey, profile.bands, profile.answers).map((id) => [
        id,
        profile.bands[id],
      ]),
    ),
    card_answers: cardAnswers,
  }
  const summaryKey = JSON.stringify([
    summaryBody.bands,
    summaryBody.card_answers,
  ])

  // One summary request per set of answers, even if the student comes back to this step.
  const loadSummary = () => {
    if (summaryAsked.current?.key !== summaryKey) {
      summaryAsked.current = {
        key: summaryKey,
        promise: requestSummary(summaryBody).then(
          (reply) => reply.about_you,
          () => null,
        ),
      }
    }
    return summaryAsked.current.promise
  }

  // Changed answers make the summary stale: forget it and the text the student confirmed.
  useEffect(() => {
    if (!summaryAsked.current || summaryAsked.current.key === summaryKey) return
    summaryAsked.current = null
    setProfile((current) => ({ ...current, about_you: '' }))
  }, [summaryKey])

  const edit = (id: StepId) => {
    goTo(id)
    setReturnToReview(['about', 'goal', 'notes'].includes(id))
  }

  const forward = () => {
    if (screen.step === 'notes') startCards()
    if (returnToReview) return goTo('review')
    const skipsSummary = screens[index + 1]?.step === 'summary' && !hermes
    moveTo(index + (skipsSummary ? 2 : 1))
  }

  // Back from the review goes to where the student came from: the last survey part if they answered
  // survey questions, else the deck.
  const goBack = () => {
    if (screen.step === 'review' && hermes) return goTo('summary')
    const noSurvey = Object.keys(profile.answers).length === 0
    if (screen.step === 'review' || screen.step === 'summary') {
      return noSurvey ? goTo('deck') : moveTo(index - (hermes ? 1 : 2))
    }
    moveTo(index - 1)
  }

  const next = () => {
    const found = validate(screen, profile, survey)
    setErrors(found)
    if (Object.keys(found).length) return
    if (screen.step !== 'review') forward()
    else buildProfile('assess')
  }

  const stepProps = { profile, update, errors }
  const showPanel = ['about', 'goal', 'notes'].includes(screen.step)
  const canSkip = screen.step === 'survey' || screen.step === 'notes'
  const isDeck = screen.step === 'deck'
  const hasOwnButtons = isDeck || screen.step === 'summary'

  if (finished && createProfile.data && ending === 'magic') {
    return <MagicStep topic={profile.topic} profileJson={createProfile.data} />
  }

  if (finished && createProfile.data) {
    return (
      <div ref={panel}>
        <AssessmentScreen
          name={profile.name}
          studentProfile={createProfile.data}
          onBack={() => setFinished(false)}
        />
      </div>
    )
  }

  return (
    <div ref={panel} className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-2.5 text-sm md:px-8">
        <span>
          <span className="font-medium">
            Schritt {stepNumber} von {steps.length}
          </span>{' '}
          · {step.title}
          <span className="text-graphite">
            {' '}
            ·{' '}
            {minutesLeft > 0
              ? `noch etwa ${minutesLeft} ${minutesLeft === 1 ? 'Minute' : 'Minuten'}`
              : 'fast fertig'}
          </span>
        </span>
        <div className="flex gap-1.5" aria-hidden>
          {steps.map((s, i) => (
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
        <span className="text-graphite">Gespeichert</span>
      </div>

      <div
        className={cn(
          'grid flex-1',
          showPanel && 'lg:grid-cols-[minmax(0,1fr)_17rem]',
        )}
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            next()
          }}
          className={cn(
            'flex min-w-0 flex-col p-5 md:px-8 md:py-1 [&_h2]:outline-none [@media(min-height:900px)]:md:py-8',
            ['survey', 'summary', 'review'].includes(screen.step) &&
              'mx-auto w-full max-w-5xl',
            isDeck && 'mx-auto w-full max-w-3xl',
          )}
        >
          {screen.step === 'about' && <AboutStep {...stepProps} />}
          {screen.step === 'goal' && <GoalStep {...stepProps} />}
          {isDeck && (
            <DeckStep
              deck={survey.deck}
              bands={profile.bands}
              onBands={(bands) => update({ bands })}
              onDone={() => goTo('summary')}
              onSurvey={() => goTo('survey')}
              onBack={() => moveTo(index - 1)}
              hermesCards={hermes?.cards ?? null}
              onCardAnswers={setCardAnswers}
            />
          )}
          {screen.step === 'survey' && category && (
            <SurveyStep {...stepProps} category={category} part={part} />
          )}
          {screen.step === 'notes' && <NotesStep {...stepProps} />}
          {screen.step === 'summary' && (
            <SummaryStep
              profile={profile}
              update={update}
              load={loadSummary}
              onNext={() => goTo('review')}
            />
          )}
          {screen.step === 'review' && (
            <ReviewStep {...stepProps} goTo={edit} />
          )}

          {createProfile.isError && (
            <p
              role="alert"
              className="mt-4 border-l-[3px] border-clay pl-3 text-sm"
            >
              Wir konnten dein Profil nicht bauen. Prüf deine Verbindung und
              versuch es nochmal.
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-4 pt-1 [@media(min-height:900px)]:mt-6">
            {index > 0 && !isDeck ? (
              <button
                type="button"
                className="text-button inline-flex items-center gap-2 pl-0"
                onClick={goBack}
              >
                <ArrowLeft size={18} aria-hidden />
                Zurück
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              {screen.step === 'survey' && part < survey.categories.length && (
                // Skipped parts send no answers; the server leaves their categories out of the profile.
                <button
                  type="button"
                  className="text-button"
                  onClick={() => goTo('summary')}
                >
                  Rest überspringen
                </button>
              )}
              {canSkip && (
                <button type="button" className="text-button" onClick={forward}>
                  Überspringen
                </button>
              )}
              {!hasOwnButtons && (
                <button type="submit" className="primary large">
                  {createProfile.isPending && ending === 'assess'
                    ? 'Wird gebaut…'
                    : screen.step === 'review'
                      ? 'Meine Lösung bauen'
                      : 'Weiter'}
                  <ArrowRight size={18} aria-hidden />
                </button>
              )}
              {screen.step === 'review' && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => buildProfile('magic')}
                >
                  {createProfile.isPending && ending === 'magic'
                    ? 'Wird gebaut…'
                    : 'Magic-Seite'}
                  <Sparkles size={18} aria-hidden />
                </button>
              )}
            </div>
          </div>
        </form>

        {showPanel && <ProfilePanel profile={profile} />}
      </div>
    </div>
  )
}

// Loads the survey questions from the server before showing the form.
function ApplicationForm() {
  const survey = useSurveyQuestions()

  if (survey.data) {
    return (
      <SurveyContext value={survey.data}>
        <Form />
      </SurveyContext>
    )
  }

  return (
    <div className="p-8 md:p-14">
      {survey.isError ? (
        <div role="alert">
          <p>
            Wir konnten das Formular nicht laden. Prüf deine Verbindung und
            versuch es nochmal.
          </p>
          <button className="primary mt-6" onClick={() => survey.refetch()}>
            Nochmal versuchen
          </button>
        </div>
      ) : (
        <p className="text-graphite">Alles wird vorbereitet…</p>
      )}
    </div>
  )
}

export { ApplicationForm }
