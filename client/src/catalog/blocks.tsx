// React implementations of the catalog formats, in the application page's tokens (application.css),
// so the Graustufen and dark looks restyle them too.
import { Component, useState, type ReactNode } from 'react'

const card = 'rounded-[20px] bg-sheet p-6 text-ink ring-1 ring-rule shadow-card'
const choice =
  'rounded-xl px-4 py-3 text-left text-base ring-1 ring-rule transition-colors hover:bg-pine-soft focus-visible:ring-2 focus-visible:ring-pine focus-visible:outline-none'

// json-render hides a block that throws (e.g. Hermes sent an object where text belongs);
// this shows the student a note instead of an empty part.
export class SafeBlock extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override render() {
    if (this.state.failed) {
      return (
        <p className="rounded-[20px] bg-pine-soft p-6 text-ink">
          Dieser Teil konnte nicht gezeigt werden. Mach mit dem nächsten weiter.
        </p>
      )
    }
    return this.props.children
  }
}

export function Card({ children }: { children: ReactNode }) {
  return <section className={card}>{children}</section>
}

// The exact sentence the block came from, so the student can always check it against their material.
export function Original({ source }: { source?: string }) {
  if (!source) return null
  return (
    <details className="mt-5 text-base text-graphite">
      <summary className="cursor-pointer font-medium select-none hover:text-pine">
        Original zeigen
      </summary>
      <blockquote className="mt-2 border-l-4 border-pine/40 pl-4">
        {source}
      </blockquote>
    </details>
  )
}

export function Flashcard({
  front,
  back,
  source,
}: {
  front?: string
  back?: string
  source?: string
}) {
  const [turned, setTurned] = useState(false)
  return (
    <Card>
      <button
        type="button"
        onClick={() => setTurned(!turned)}
        aria-pressed={turned}
        className="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl bg-pine-soft p-6 text-center transition-colors focus-visible:ring-2 focus-visible:ring-pine focus-visible:outline-none"
      >
        <span className="text-2xl font-semibold">{turned ? back : front}</span>
        <span className="text-sm text-graphite">
          {turned ? 'Tippen zum Zurückdrehen' : 'Tippen zum Umdrehen'}
        </span>
      </button>
      <Original source={source} />
    </Card>
  )
}

interface QuizProps {
  question?: string
  options?: string[]
  answer?: number
  explanation?: string
  source?: string
}

export function Quiz({
  question,
  options = [],
  answer,
  explanation,
  source,
}: QuizProps) {
  const [picked, setPicked] = useState<number | null>(null)
  const correct = picked !== null && picked === answer
  return (
    <Card>
      <h3 className="text-xl font-semibold">{question}</h3>
      <div className="mt-4 grid gap-2">
        {options.map((option, i) => (
          <button
            key={i}
            type="button"
            className={`${choice} ${
              picked === i
                ? correct
                  ? 'bg-pine text-white hover:bg-pine'
                  : 'bg-red-50 text-red-900 ring-red-300'
                : ''
            }`}
            onClick={() => setPicked(i)}
          >
            {option}
          </button>
        ))}
      </div>
      {picked !== null && (
        <output className="mt-4 block text-lg">
          <strong>{correct ? 'Richtig! ' : 'Nicht ganz. '}</strong>
          {explanation}
        </output>
      )}
      <Original source={source} />
    </Card>
  )
}

export function ReadAloud({
  text,
  source,
}: {
  text?: string
  source?: string
}) {
  const [speaking, setSpeaking] = useState(false)
  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text ?? '')
    utterance.lang = 'de-DE'
    utterance.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }
  return (
    <Card>
      <button
        type="button"
        onClick={toggle}
        disabled={!text}
        className="rounded-full bg-pine px-5 py-2 font-semibold text-white disabled:opacity-45"
      >
        {speaking ? '■ Stopp' : '▶ Anhören'}
      </button>
      <p className="mt-4 text-lg leading-relaxed">{text}</p>
      <Original source={source} />
    </Card>
  )
}
