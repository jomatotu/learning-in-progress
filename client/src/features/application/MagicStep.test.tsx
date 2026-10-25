import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MagicStep } from './MagicStep'
import type { StudentProfile } from '@/api/profile'

afterEach(() => vi.unstubAllGlobals())

const spec = {
  root: 'lesson',
  elements: {
    lesson: {
      type: 'Lesson',
      props: { title: 'Zellen' },
      children: ['chunk', 'quiz'],
    },
    chunk: {
      type: 'Chunk',
      props: {
        heading: 'DNA',
        text: 'DNA speichert Gene.',
        source: 'DNA ist der Träger der Erbinformation.',
      },
      children: [],
    },
    quiz: {
      type: 'Quiz',
      props: {
        question: 'Was speichert die DNA?',
        options: ['Fett', 'Gene'],
        answer: 1,
        explanation: 'DNA trägt die Erbinformation.',
        source: 'DNA ist der Träger der Erbinformation.',
      },
      children: [],
    },
  },
}

describe('MagicStep', () => {
  it('tells the student to sign in when the server answers access_required', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        Response.json({ detail: 'access_required' }, { status: 401 }),
      ),
    )
    render(
      <MagicStep topic="Bruchrechnen" profileJson={{} as StudentProfile} />,
    )

    await userEvent.setup().click(screen.getByRole('button'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Bitte melde dich mit dem Zugangscode an.',
    )
  })

  it('renders the lesson spec Hermes built, with a working quiz', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => Response.json({ spec })),
    )
    const user = userEvent.setup()
    render(<MagicStep topic="Zellen" profileJson={{} as StudentProfile} />)

    await user.click(screen.getByRole('button'))

    expect(
      await screen.findByRole('heading', { name: 'Zellen' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'DNA' })).toBeInTheDocument()
    expect(screen.getByText('DNA speichert Gene.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Gene' }))
    expect(screen.getByRole('status')).toHaveTextContent('Richtig!')
  })

  it('shows an error instead of a blank page for a broken spec', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        Response.json({ spec: { root: 'missing', elements: {} } }),
      ),
    )
    render(<MagicStep topic="Zellen" profileJson={{} as StudentProfile} />)

    await userEvent.setup().click(screen.getByRole('button'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Das hat nicht geklappt.',
    )
  })
})
