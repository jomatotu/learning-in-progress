import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { LanguageProvider } from '@/components/LanguageProvider'
import { Learn } from './Learn'
import { loadPage, saveRun, type LearnRun } from './learnStore'

const run: LearnRun = {
  profile: { name: 'Peter', challenges: ['ADHD'], goals: '', interests: [] },
  answers: [{ question: 'Reading or listening?', answer: 'Listening' }],
  material: 'Osmosis',
  themes: [
    { theme: 'read-aloud', reason: 'You like listening.' },
    { theme: 'chunked', reason: 'Short steps.' },
  ],
}

const source = 'Osmose ist Diffusion von Wasser.'
const lesson = {
  type: 'Lesson',
  props: { title: 'Osmose' },
  children: ['c1', 'c2'],
}
const chunk = (heading: string) => ({
  type: 'Chunk',
  props: { heading, text: 'Wasser wandert.', source },
  children: [],
})

function spec(title: string) {
  return {
    root: 'lesson',
    elements: {
      lesson: { ...lesson, props: { title }, children: ['c1'] },
      c1: chunk('Teil 1'),
    },
  }
}

function add(path: string, value: unknown) {
  return `event: patch\ndata: ${JSON.stringify({ patch: { op: 'add', path, value } })}\n\n`
}

function renderAt(path: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LanguageProvider initial="de">
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/learn/:id" element={<Learn />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

// A response whose server-sent events the test sends one by one.
function controlledStream() {
  let send = (_text: string) => {}
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      send = (text) => {
        controller.enqueue(new TextEncoder().encode(text))
        if (/^event: (done|error)/.test(text)) controller.close()
      }
    },
  })
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(() => Promise.resolve(new Response(body))),
  )
  return (text: string) => send(text)
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  sessionStorage.clear()
})

describe('Learn', () => {
  it('generates every theme at once as lessons and switches between them', async () => {
    const fetchMock = vi.fn<typeof fetch>((_url, init) => {
      const body = JSON.parse(typeof init?.body === 'string' ? init.body : '{}')
      const theme = body.theme as string
      return Promise.resolve(
        new Response(
          `event: done\ndata: ${JSON.stringify({ spec: spec(theme) })}\n\n`,
        ),
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    const id = saveRun(run)
    renderAt(`/learn/${id}`)

    expect(
      await screen.findByRole('heading', { name: 'read-aloud' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'chunked', hidden: true }),
    ).not.toBeVisible()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(loadPage(id, 'chunked', 'spec')).toEqual({ spec: spec('chunked') })

    await userEvent.click(screen.getByRole('tab', { name: 'Chunked steps' }))
    expect(screen.getByRole('heading', { name: 'chunked' })).toBeVisible()
  })

  it('shows each block the moment its patch lands, with the Morph loader only before the first block', async () => {
    const send = controlledStream()
    const id = saveRun({ ...run, themes: [run.themes[1]] })
    renderAt(`/learn/${id}`)

    expect(
      screen.getByRole('img', { name: 'Morph arbeitet' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Morph liest deinen Text…')).toBeInTheDocument()

    send(add('/root', 'lesson'))
    send(add('/elements/lesson', lesson))
    expect(
      await screen.findByRole('heading', { name: 'Osmose' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Morph arbeitet' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Morph formt deine Seite…')).toBeInTheDocument()

    send(add('/elements/c1', chunk('Teil 1')))
    expect(
      await screen.findByRole('heading', { name: 'Teil 1' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Morph arbeitet' })).toBeNull()
    expect(screen.getByText('Fast fertig…')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Teil 2' })).toBeNull()

    send(add('/elements/c2', chunk('Teil 2')))
    expect(
      await screen.findByRole('heading', { name: 'Teil 2' }),
    ).toBeInTheDocument()

    const final = {
      root: 'lesson',
      elements: { lesson, c1: chunk('Teil 1'), c2: chunk('Teil 2') },
    }
    send(`event: done\ndata: ${JSON.stringify({ spec: final })}\n\n`)
    expect(
      await screen.findByText(
        'Was soll Morph beim nächsten Mal anders machen?',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('Fast fertig…')).toBeNull()
    expect(loadPage(id, 'chunked', 'spec')).toEqual({ spec: final })
  })

  it('keeps tool names and reasoning behind the watch button', async () => {
    const send = controlledStream()
    const id = saveRun({ ...run, themes: [run.themes[1]] })
    renderAt(`/learn/${id}`)

    send('event: status\ndata: {"text": "Schreibe Dateien…"}\n\n')
    send('event: reasoning\ndata: {"text": "Let me think in English."}\n\n')
    const watch = screen.getByRole('button', {
      name: 'Morph bei der Arbeit zusehen',
    })
    expect(watch).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(watch)
    expect(await screen.findByText('Schreibe Dateien…')).toBeInTheDocument()
    expect(screen.getByLabelText('Hermes denkt')).toHaveTextContent(
      'Let me think in English.',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Ausblenden' }))
    expect(screen.queryByText('Schreibe Dateien…')).toBeNull()
    expect(screen.queryByText(/Let me think/)).toBeNull()
    expect(screen.getByText('Morph liest deinen Text…')).toBeInTheDocument()
  })

  it('shows saved lessons without generating them again', () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    const id = saveRun({ ...run, themes: [run.themes[1]] })
    localStorage.setItem(
      `lip-learn-${id}-chunked`,
      JSON.stringify({ spec: spec('Gespeichert') }),
    )
    renderAt(`/learn/${id}`)

    expect(
      screen.getByRole('heading', { name: 'Gespeichert' }),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('builds HTML pages with ?format=html, live preview first', async () => {
    const send = controlledStream()
    const id = saveRun({ ...run, themes: [run.themes[1]] })
    renderAt(`/learn/${id}?format=html`)

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    const sent = vi.mocked(fetch).mock.calls[0][1]?.body
    expect(JSON.parse(typeof sent === 'string' ? sent : '{}').format).toBe(
      'html',
    )
    expect(
      screen.getByRole('img', { name: 'Morph arbeitet' }),
    ).toBeInTheDocument()

    send(
      `event: preview\ndata: ${JSON.stringify({ html: '<p>draft</p>' })}\n\n`,
    )
    const frame = await screen.findByTitle('Your learning page')
    expect(frame).toHaveAttribute('srcdoc', '<p>draft</p>')
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts')
    expect(screen.getByText('Morph formt deine Seite…')).toBeInTheDocument()

    send(`event: done\ndata: ${JSON.stringify({ html: '<p>final</p>' })}\n\n`)
    await waitFor(() =>
      expect(screen.getByTitle('Your learning page')).toHaveAttribute(
        'srcdoc',
        '<p>final</p>',
      ),
    )
    expect(screen.queryByText('Morph formt deine Seite…')).toBeNull()
    expect(loadPage(id, 'chunked', 'html')).toEqual({ html: '<p>final</p>' })
  })

  it('says so when the run is missing', () => {
    renderAt('/learn/nope')

    expect(screen.getByRole('alert')).toHaveTextContent('nicht gefunden')
  })
})
