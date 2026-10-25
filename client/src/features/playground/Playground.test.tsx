import { studentId } from '@/api/studentId'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { loadRun } from '@/features/learn/learnStore'
import { Playground } from './Playground'
import { mockStudent } from './mockStudent'

function renderApp() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Playground />
    </QueryClientProvider>,
  )
}

function sse(event: string, data: unknown) {
  return new Response(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

const question = {
  done: false,
  question: 'Reading or listening?',
  options: ['Reading', 'Listening'],
  themes: [],
}
const finished = {
  done: true,
  question: '',
  options: [],
  themes: [{ theme: 'read-aloud', reason: 'You like listening.' }],
}
const answers = [{ question: 'Reading or listening?', answer: 'Listening' }]
const startButton = { name: 'Einschätzung starten' }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Playground', () => {
  it('starts with the mock profile and material in the boxes', () => {
    renderApp()

    expect(screen.getByLabelText('Schülerprofil')).toHaveValue(
      JSON.stringify(mockStudent.profile, null, 2),
    )
    expect(screen.getByLabelText('Lernmaterial')).toHaveValue(
      mockStudent.material,
    )
  })

  it('asks questions until done, then opens the pages in a new tab', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(sse('done', question))
      .mockResolvedValueOnce(sse('done', finished))
    const openMock = vi.fn<(url: string | URL, target?: string) => void>()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('open', openMock)
    renderApp()

    await userEvent.click(screen.getByRole('button', startButton))
    await userEvent.click(
      await screen.findByRole('button', { name: 'Listening' }),
    )
    expect(await screen.findByText(/You like listening/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Generieren' }))

    expect(fetchMock.mock.calls[1][1]?.body).toBe(
      JSON.stringify({
        profile: mockStudent.profile,
        answers,
        material: mockStudent.material,
        student_id: studentId(),
      }),
    )
    const [url, target] = openMock.mock.calls[0]
    expect(target).toBe('_blank')
    expect(loadRun(String(url).replace('/learn/', ''))).toEqual({
      profile: mockStudent.profile,
      answers,
      material: mockStudent.material,
      themes: finished.themes,
    })
    expect(screen.getByText(/You like listening/)).toBeInTheDocument()
  })

  it('shows the error and retries with the same answers', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          sse('error', {
            message: 'Morph hat nicht geantwortet. Versuch es nochmal.',
          }),
        )
        .mockResolvedValueOnce(sse('done', question)),
    )
    renderApp()

    await userEvent.click(screen.getByRole('button', startButton))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Morph hat nicht geantwortet. Versuch es nochmal.',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Nochmal versuchen' }),
    )

    expect(
      await screen.findByRole('button', { name: 'Listening' }),
    ).toBeInTheDocument()
  })

  it('does not start with invalid JSON', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    renderApp()

    fireEvent.change(screen.getByLabelText('Schülerprofil'), {
      target: { value: '{ nope' },
    })
    await userEvent.click(screen.getByRole('button', startButton))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Das Profil ist kein gültiges JSON.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
