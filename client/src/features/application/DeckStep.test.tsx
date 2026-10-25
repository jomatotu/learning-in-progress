import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DeckEntry } from '@/lib/survey'
import { DeckStep } from './DeckStep'

const deck: DeckEntry[] = [
  {
    category: 'a',
    title: 'Eins',
    low: { text: 'Low A', reason: 'Deshalb low A' },
    medium: { text: 'Medium A' },
    high: { text: 'High A', reason: 'Deshalb high A' },
  },
  {
    category: 'b',
    title: 'Zwei',
    low: { text: 'Low B', reason: 'Deshalb low B' },
    medium: { text: 'Medium B' },
    high: { text: 'High B', reason: 'Deshalb high B' },
  },
]

function setup() {
  const onBands = vi.fn<(bands: Record<string, string>) => void>()
  const onDone = vi.fn<() => void>()
  const onSurvey = vi.fn<() => void>()
  const onBack = vi.fn<() => void>()
  const user = userEvent.setup()
  render(
    <>
      <input aria-label="frei" />
      <DeckStep
        deck={deck}
        bands={{}}
        onBands={onBands}
        onDone={onDone}
        onSurvey={onSurvey}
        onBack={onBack}
      />
    </>,
  )
  return { user, onBands, onDone, onSurvey, onBack }
}

describe('DeckStep', () => {
  it('shows the first card with kicker, reason and progress', () => {
    setup()
    expect(screen.getByText('Das heißt für dich')).toBeInTheDocument()
    expect(screen.getByText('Low A')).toBeInTheDocument()
    expect(screen.getByText('Deshalb low A')).toBeInTheDocument()
    expect(screen.getByText('Karte 1 von etwa 2')).toBeInTheDocument()
  })

  it('Stimmt sets the low band and shows the next category', async () => {
    const { user, onBands } = setup()
    await user.click(screen.getByRole('button', { name: /stimmt/i }))
    expect(onBands).toHaveBeenLastCalledWith({ a: 'low' })
    expect(screen.getByText('Low B')).toBeInTheDocument()
  })

  it('Eher nicht shows the high card and grows the estimate; a second Eher nicht means medium', async () => {
    const { user, onBands } = setup()
    await user.click(screen.getByRole('button', { name: 'Eher nicht' }))
    expect(screen.getByText('High A')).toBeInTheDocument()
    expect(screen.getByText('Karte 2 von etwa 3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Eher nicht' }))
    expect(onBands).toHaveBeenLastCalledWith({ a: 'medium' })
  })

  it('Weiß nicht sets no band and the last card ends the deck', async () => {
    const { user, onBands, onDone } = setup()
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    expect(onBands).toHaveBeenLastCalledWith({})
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('offers the 30 questions on the last card only', async () => {
    const { user, onSurvey } = setup()
    expect(screen.queryByText('Genauer? 30 kurze Fragen')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    await user.click(
      screen.getByRole('button', { name: 'Genauer? 30 kurze Fragen' }),
    )
    expect(onSurvey).toHaveBeenCalledOnce()
  })

  it('Enter answers Stimmt and Backspace answers Eher nicht', async () => {
    const { user, onBands } = setup()
    await user.keyboard('{Enter}')
    expect(onBands).toHaveBeenLastCalledWith({ a: 'low' })
    expect(screen.getByText('Low B')).toBeInTheDocument()
    await user.keyboard('{Backspace}')
    expect(screen.getByText('High B')).toBeInTheDocument()
  })

  it('ignores shortcuts while typing in a text field', async () => {
    const { user, onBands } = setup()
    await user.click(screen.getByLabelText('frei'))
    await user.keyboard('{Enter}{Backspace}')
    expect(onBands).not.toHaveBeenCalled()
    expect(screen.getByText('Low A')).toBeInTheDocument()
  })

  it('answers once, not twice, when Enter hits a focused button', async () => {
    const { user, onBands } = setup()
    screen.getByRole('button', { name: /stimmt/i }).focus()
    await user.keyboard('{Enter}')
    expect(onBands).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Low B')).toBeInTheDocument()
  })

  it('Zurück on the first card leaves the deck', async () => {
    const { user, onBack } = setup()
    await user.click(screen.getByRole('button', { name: 'Zurück' }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('Zurück undoes the last answer, including the band and the estimate', async () => {
    const { user, onBands, onBack } = setup()
    await user.click(screen.getByRole('button', { name: /stimmt/i }))
    expect(screen.getByText('Low B')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Zurück' }))
    expect(screen.getByText('Low A')).toBeInTheDocument()
    expect(onBands).toHaveBeenLastCalledWith({})
    expect(onBack).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Eher nicht' }))
    expect(screen.getByText('Karte 2 von etwa 3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Zurück' }))
    expect(screen.getByText('Karte 1 von etwa 2')).toBeInTheDocument()
    expect(screen.getByText('Low A')).toBeInTheDocument()
  })

  it('reads the reason together with the card text in one live region', () => {
    setup()
    const live = screen.getByText('Low A').closest('[aria-live]')
    expect(live).toHaveTextContent('Deshalb low A')
  })
})
