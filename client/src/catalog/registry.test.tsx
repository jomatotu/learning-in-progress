import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Spec } from '@json-render/core'
import { LessonView } from './LessonView'

function specWith(type: string, props: Record<string, unknown>): Spec {
  return {
    root: 'lesson',
    elements: {
      lesson: { type: 'Lesson', props: { title: 'Cells' }, children: ['b1'] },
      b1: { type, props, children: [] },
    },
  }
}

describe('lesson blocks', () => {
  it('Chunk shows its text and keeps the original quote one tap away', async () => {
    render(
      <LessonView
        spec={specWith('Chunk', {
          heading: 'DNA',
          text: 'DNA stores genes.',
          source: 'DNA is the carrier of genetic information.',
        })}
      />,
    )

    expect(screen.getByRole('heading', { name: 'DNA' })).toBeInTheDocument()
    expect(
      screen.getByText('DNA is the carrier of genetic information.'),
    ).not.toBeVisible()
    await userEvent.click(screen.getByText('Original zeigen'))
    expect(
      screen.getByText('DNA is the carrier of genetic information.'),
    ).toBeVisible()
  })

  it('Quiz reacts right away to a wrong and a right answer', async () => {
    render(
      <LessonView
        spec={specWith('Quiz', {
          question: 'Where is DNA copied?',
          options: ['Ribosome', 'Nucleus'],
          answer: 1,
          explanation: 'Transcription happens in the nucleus.',
          source: 's',
        })}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Ribosome' }))
    expect(screen.getByRole('status')).toHaveTextContent('Nicht ganz')
    await userEvent.click(screen.getByRole('button', { name: 'Nucleus' }))
    expect(screen.getByRole('status')).toHaveTextContent('Richtig')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Transcription happens in the nucleus.',
    )
  })

  it('Flashcard turns over to show the back', async () => {
    render(
      <LessonView
        spec={specWith('Flashcard', {
          front: 'mRNA',
          back: 'A copy of a gene',
          source: 's',
        })}
      />,
    )

    expect(screen.queryByText('A copy of a gene')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /mRNA/ }))
    expect(screen.getByText('A copy of a gene')).toBeInTheDocument()
  })

  it('ReadAloud speaks its text with the browser voice', async () => {
    const speak = vi.fn<(utterance: unknown) => void>()
    vi.stubGlobal('speechSynthesis', {
      speak,
      cancel: vi.fn<() => void>(),
      speaking: false,
    })
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        text: string
        constructor(text: string) {
          this.text = text
        }
      },
    )
    render(
      <LessonView
        spec={specWith('ReadAloud', {
          text: 'Genes code for proteins.',
          source: 's',
        })}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /Anhören/ }))

    expect(speak).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Genes code for proteins.' }),
    )
    vi.unstubAllGlobals()
  })

  it('Steps lists every step in order', () => {
    render(
      <LessonView
        spec={specWith('Steps', {
          title: 'Protein synthesis',
          steps: [
            { label: 'Transcription', text: 'DNA to mRNA' },
            { label: 'Translation', text: 'mRNA to protein' },
          ],
          source: 's',
        })}
      />,
    )

    const items = screen.getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      'TranscriptionDNA to mRNA',
      'TranslationmRNA to protein',
    ])
  })

  it('renders a half-streamed block without crashing', () => {
    render(<LessonView spec={specWith('Quiz', { question: 'Where?' })} />)

    expect(screen.getByText('Where?')).toBeInTheDocument()
  })

  it('shows a short note instead of crashing when the model sends a broken block', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <LessonView
        spec={specWith('Chunk', {
          heading: { not: 'text' },
          text: 't',
          source: 's',
        })}
      />,
    )

    expect(screen.getByText(/konnte nicht gezeigt werden/)).toBeInTheDocument()
    vi.restoreAllMocks()
  })
})
