import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
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

function renderAt(path: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/learn/:id" element={<Learn />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function page(theme: string) {
  return new Response(
    `event: done\ndata: ${JSON.stringify({ html: `<p>${theme}</p>` })}\n\n`,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('Learn', () => {
  it('generates every theme at once and switches between them', async () => {
    const fetchMock = vi.fn<typeof fetch>((_url, init) => {
      const body = typeof init?.body === 'string' ? init.body : '{}'
      return Promise.resolve(page(JSON.parse(body).theme as string))
    })
    vi.stubGlobal('fetch', fetchMock)
    const id = saveRun(run)
    renderAt(`/learn/${id}`)

    await waitFor(() =>
      expect(
        screen
          .getAllByTitle('Your learning page')
          .map((frame) => frame.getAttribute('srcdoc')),
      ).toEqual(['<p>read-aloud</p>', '<p>chunked</p>']),
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(loadPage(id, 'chunked')).toBe('<p>chunked</p>')

    const [first, second] = screen.getAllByRole('tabpanel', { hidden: true })
    expect(first).toBeVisible()
    expect(second).not.toBeVisible()
    await userEvent.click(screen.getByRole('tab', { name: 'Chunked steps' }))
    expect(first).not.toBeVisible()
    expect(second).toBeVisible()
  })

  it('shows the half-written page live, then swaps to the finished one', async () => {
    let send = (_text: string) => {}
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        send = (text) => {
          controller.enqueue(new TextEncoder().encode(text))
          if (text.startsWith('event: done')) controller.close()
        }
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() => Promise.resolve(new Response(body))),
    )
    const id = saveRun({ ...run, themes: [run.themes[1]] })
    renderAt(`/learn/${id}`)

    send(
      `event: preview\ndata: ${JSON.stringify({ html: '<p>draft</p>' })}\n\n`,
    )
    const frame = await screen.findByTitle('Your learning page')
    expect(frame).toHaveAttribute('srcdoc', '<p>draft</p>')
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts')
    expect(screen.getByRole('status')).toHaveTextContent('Tabula baut gerade')

    send(`event: done\ndata: ${JSON.stringify({ html: '<p>final</p>' })}\n\n`)
    await waitFor(() =>
      expect(screen.getByTitle('Your learning page')).toHaveAttribute(
        'srcdoc',
        '<p>final</p>',
      ),
    )
    expect(screen.queryByText(/Tabula baut gerade/)).not.toBeInTheDocument()
  })

  it('shows saved pages without generating them again', () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    const id = saveRun({ ...run, themes: [run.themes[1]] })
    localStorage.setItem(`lip-learn-${id}-chunked`, '<p>saved</p>')
    renderAt(`/learn/${id}`)

    expect(screen.getByTitle('Your learning page')).toHaveAttribute(
      'srcdoc',
      '<p>saved</p>',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('says so when the run is missing', () => {
    renderAt('/learn/nope')

    expect(screen.getByRole('alert')).toHaveTextContent('nicht gefunden')
  })
})
