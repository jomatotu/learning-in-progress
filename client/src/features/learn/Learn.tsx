import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import type { Spec } from '@json-render/core'
import { themeTitles, type ThemeName } from '@/api/assess'
import { errorMessage } from '@/api/errorMessage'
import { useGeneratePage, type PageFormat } from '@/api/generate'
import { HermesProgress } from '@/components/HermesProgress'
import { LearningPage } from '@/components/LearningPage'
import type { MorphStep } from '@/components/MorphLoader'
import { LessonView } from '@/catalog/LessonView'
import { FeedbackBox } from './FeedbackBox'
import { Button } from '@/components/ui/button'
import { defineMessages, useMessages } from '@/lib/i18n'
import { loadPage, loadRun, savePage, type LearnRun } from './learnStore'

const messages = defineMessages({
  en: {
    notFound:
      'This learning page was not found. Start again from the playground.',
    themes: 'Themes',
    tryAgain: 'Try again',
  },
  de: {
    notFound:
      'Diese Lernseite wurde nicht gefunden. Starte nochmal im Playground.',
    themes: 'Themen',
    tryAgain: 'Nochmal versuchen',
  },
})

// Opens in its own tab: generates a page for every picked theme at once and lets the student switch between them.
// Lessons stream as json-render blocks; ?format=html has Hermes write whole HTML pages instead.
export function Learn() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const format: PageFormat = params.get('format') === 'html' ? 'html' : 'spec'
  const [run] = useState(() => loadRun(id))
  const [selected, setSelected] = useState(run?.themes[0]?.theme)
  const t = useMessages(messages)

  if (!run) {
    return (
      <main className="p-6">
        <p role="alert">{t.notFound}</p>
      </main>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div
        role="tablist"
        aria-label={t.themes}
        className="flex flex-wrap gap-2 border-b p-2"
      >
        {run.themes.map((pick) => (
          <Button
            key={pick.theme}
            role="tab"
            aria-selected={pick.theme === selected}
            variant={pick.theme === selected ? 'default' : 'outline'}
            onClick={() => setSelected(pick.theme)}
          >
            {themeTitles[pick.theme]}
          </Button>
        ))}
      </div>
      {/* All panels stay mounted, so every page generates in parallel and keeps its place when hidden. */}
      {run.themes.map((pick) => (
        <ThemePanel
          key={pick.theme}
          id={id}
          run={run}
          theme={pick.theme}
          format={format}
          hidden={pick.theme !== selected}
        />
      ))}
    </div>
  )
}

type ThemePanelProps = {
  id: string
  run: LearnRun
  theme: ThemeName
  format: PageFormat
  hidden: boolean
}

// One theme's lesson: shows the saved one, or generates it and shows each block (or the page so far) as it lands.
function ThemePanel({ id, run, theme, format, hidden }: ThemePanelProps) {
  const generate = useGeneratePage()
  const [saved] = useState(() => loadPage(id, theme, format))
  const started = useRef(false)
  const t = useMessages(messages)

  function start() {
    const { profile, answers, material } = run
    generate.mutate(
      { profile, answers, material, theme, format },
      { onSuccess: (page) => savePage(id, theme, page) },
    )
  }

  useEffect(() => {
    // The ref stops StrictMode's second effect run from starting another expensive Hermes run.
    if (saved || started.current) return
    started.current = true
    start()
    // oxlint-disable-next-line react/exhaustive-deps
  }, [])

  const spec = saved && 'spec' in saved ? saved.spec : generate.spec
  const html =
    (saved && 'html' in saved ? saved.html : generate.html) ??
    (generate.isError ? '' : generate.preview)
  const done = Boolean(saved ?? generate.data)

  const footer = generate.isError ? (
    <>
      <p role="alert" className="text-destructive">
        {errorMessage(generate.error)}
      </p>
      <Button className="self-start" onClick={start}>
        {t.tryAgain}
      </Button>
    </>
  ) : done ? (
    <FeedbackBox theme={theme} />
  ) : (
    <HermesProgress
      status={generate.status}
      reasoning={generate.reasoning}
      step={html ? 1 : buildStep(spec)}
      shape={!html && !hasBlocks(spec)}
    />
  )

  if (html) {
    return (
      <div role="tabpanel" hidden={hidden} className="flex flex-1 flex-col">
        <LearningPage html={html} />
        <div className="application-page mx-auto flex w-full max-w-3xl flex-col gap-3 p-6">
          {footer}
        </div>
      </div>
    )
  }
  return (
    <div
      role="tabpanel"
      hidden={hidden}
      className="application-page flex-1 overflow-y-auto"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
        {spec && <LessonView spec={spec} loading={!done} />}
        {footer}
      </div>
    </div>
  )
}

function hasBlocks(spec: Spec | null): boolean {
  return Object.values(spec?.elements ?? {}).some((e) => e.type !== 'Lesson')
}

// Reading until the title is there, then shaping, and almost done once all but one outlined block landed.
function buildStep(spec: Spec | null): MorphStep {
  const children = spec?.elements[spec.root]?.children
  if (!spec || !children) return 0
  const landed = children.filter((key) => key in spec.elements).length
  return landed > 0 && landed >= children.length - 1 ? 2 : 1
}
