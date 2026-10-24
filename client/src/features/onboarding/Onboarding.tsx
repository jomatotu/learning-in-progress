import { useMemo, useState } from 'react'
import { questions, steps } from './data'
import type { Step } from './data'
import { Topbar } from './Topbar'
import { Home } from './Home'
import { Dialog } from './Dialog'
import { Topic } from './Topic'
import { Brief } from './Brief'
import { Solutions } from './Solutions'
import { Magic } from './Magic'

export function Onboarding() {
  const [step, setStep] = useState<Step>(steps.home)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [topic, setTopic] = useState('')
  const [selectedSolutions, setSelectedSolutions] = useState<number[]>([0])

  const profile = useMemo(
    () => ({
      style: answers.some((answer) => /seh|Farb|Bild/i.test(answer))
        ? 'visuell und strukturiert'
        : 'aktiv und schrittweise',
      need: answers.some((answer) => /Fokus|Sprint/i.test(answer))
        ? 'kurzen, fokussierten Einheiten'
        : 'klaren, überschaubaren Einheiten',
    }),
    [answers],
  )

  function nextQuestion(answer: string) {
    setAnswers((current) => [...current, answer])
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1)
    } else {
      setStep(steps.topic)
    }
  }

  function toggleSolution(index: number) {
    setSelectedSolutions((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    )
  }

  return (
    <main className="app-shell">
      <Topbar
        step={step}
        onHome={() => {
          setQuestionIndex(0)
          setStep(steps.home)
        }}
      />

      {step === steps.home && <Home onStart={() => setStep(steps.dialog)} />}

      {step === steps.dialog && (
        <Dialog
          question={questions[questionIndex]}
          questionIndex={questionIndex}
          questionCount={questions.length}
          onBack={() =>
            questionIndex
              ? setQuestionIndex(questionIndex - 1)
              : setStep(steps.home)
          }
          onNext={nextQuestion}
        />
      )}

      {step === steps.topic && (
        <Topic
          profile={profile}
          onBack={() => setStep(steps.dialog)}
          onNext={(nextTopic) => {
            setTopic(nextTopic)
            setStep(steps.brief)
          }}
        />
      )}

      {step === steps.brief && (
        <Brief topic={topic} onNext={() => setStep(steps.solutions)} />
      )}

      {step === steps.solutions && (
        <Solutions
          selected={selectedSolutions}
          onToggle={toggleSolution}
          onBack={() => setStep(steps.brief)}
          onNext={() => setStep(steps.magic)}
        />
      )}

      {step === steps.magic && (
        <Magic
          topic={topic}
          selected={selectedSolutions}
          onBack={() => setStep(steps.solutions)}
        />
      )}
    </main>
  )
}
