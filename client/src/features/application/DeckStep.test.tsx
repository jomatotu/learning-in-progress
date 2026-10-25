import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DeckEntry } from '@/lib/survey'
import type { HermesCard } from '@/api/intake'
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

const hermes: HermesCard[] = [
  { id: 'c1', text: 'Hermes eins', yes: 'c2', no: null },
  { id: 'c2', text: 'Hermes zwei', yes: null, no: null },
]

function setup(hermesCards: HermesCard[] | null = null) {
  const onBands = vi.fn<(bands: Record<string, string>) => void>()
  const onDone = vi.fn<() => void>()
  const onSurvey = vi.fn<() => void>()
  const onBack = vi.fn<() => void>()
  const onCardAnswers = vi.fn<(a: unknown[]) => void>()
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
        hermesCards={hermesCards}
        onCardAnswers={onCardAnswers}
      />
    </>,
  )
  return { user, onBands, onDone, onSurvey, onBack, onCardAnswers }
}

describe('DeckStep', () => {
  it('shows the first card with kicker, reason and progress', () => {
    setup()
    expect(screen.getByText('Das heißt für dich')).toBeInTheDocument()
    expect(screen.getByText('Low A')).toBeInTheDocument()
    expect(screen.getByText('Deshalb low A')).toBeInTheDocument()
    expect(screen.getByText('Karte 1 von etwa 5')).toBeInTheDocument()
  })

  it('Stimmt sets the low band and shows the next category', async () => {
    const { user, onBands } = setup()
    await user.click(screen.getByRole('button', { name: /stimmt/i }))
    expect(onBands).toHaveBeenLastCalledWith({ a: 'low' })
    expect(screen.getByText('Low B')).toBeInTheDocument()
  })

  it('Eher nicht shows the high card and keeps the estimate; a second Eher nicht means medium', async () => {
    const { user, onBands } = setup()
    await user.click(screen.getByRole('button', { name: 'Eher nicht' }))
    expect(screen.getByText('High A')).toBeInTheDocument()
    expect(screen.getByText('Karte 2 von etwa 5')).toBeInTheDocument()
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

  it('Zurück undoes the last answer, including the band', async () => {
    const { user, onBands, onBack } = setup()
    await user.click(screen.getByRole('button', { name: /stimmt/i }))
    expect(screen.getByText('Low B')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Zurück' }))
    expect(screen.getByText('Low A')).toBeInTheDocument()
    expect(onBands).toHaveBeenLastCalledWith({})
    expect(onBack).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Eher nicht' }))
    expect(screen.getByText('Karte 2 von etwa 5')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Zurück' }))
    expect(screen.getByText('Karte 1 von etwa 5')).toBeInTheDocument()
    expect(screen.getByText('Low A')).toBeInTheDocument()
  })

  it('reads the reason together with the card text in one live region', () => {
    setup()
    const live = screen.getByText('Low A').closest('[aria-live]')
    expect(live).toHaveTextContent('Deshalb low A')
  })

  it('continues into the Hermes cards after the base cards', async () => {
    const { user, onDone, onCardAnswers } = setup(hermes)
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    expect(onDone).not.toHaveBeenCalled()
    expect(screen.getByText('Morph fragt')).toBeInTheDocument()
    expect(screen.getByText('Hermes eins')).toBeInTheDocument()
    expect(screen.queryByText('Das heißt für dich')).toBeNull()

    await user.click(screen.getByRole('button', { name: /stimmt/i }))
    expect(screen.getByText('Hermes zwei')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Eher nicht' }))
    expect(onDone).toHaveBeenCalledOnce()
    expect(onCardAnswers).toHaveBeenLastCalledWith([
      { id: 'c1', answer: 'stimmt' },
      { id: 'c2', answer: 'eher_nicht' },
    ])
  })

  it('does not record Weiß nicht on a Hermes card and ends the tree', async () => {
    const { user, onDone, onCardAnswers } = setup(hermes)
    await user.keyboard('{Enter}{Enter}')
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    expect(onDone).toHaveBeenCalledOnce()
    expect(onCardAnswers).toHaveBeenLastCalledWith([])
  })

  it('ends after the base cards when there are no Hermes cards', async () => {
    const { user, onDone } = setup(null)
    await user.keyboard('{Enter}{Enter}')
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('Zurück from the first Hermes card restores the last base card and its band', async () => {
    const { user, onBands, onDone } = setup(hermes)
    await user.keyboard('{Enter}{Enter}')
    expect(screen.getByText('Hermes eins')).toBeInTheDocument()
    expect(onBands).toHaveBeenLastCalledWith({ a: 'low', b: 'low' })

    await user.click(screen.getByRole('button', { name: 'Zurück' }))
    expect(screen.getByText('Low B')).toBeInTheDocument()
    expect(onBands).toHaveBeenLastCalledWith({ a: 'low' })
    expect(onDone).not.toHaveBeenCalled()
  })

  it('Zurück between Hermes cards keeps the last base answer and drops the Hermes answer', async () => {
    const { user, onBands, onCardAnswers } = setup(hermes)
    await user.keyboard('{Enter}{Enter}{Enter}')
    expect(screen.getByText('Hermes zwei')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Zurück' }))
    expect(screen.getByText('Hermes eins')).toBeInTheDocument()
    expect(onBands).toHaveBeenLastCalledWith({ a: 'low', b: 'low' })
    await user.click(screen.getByRole('button', { name: 'Eher nicht' }))
    expect(onCardAnswers).toHaveBeenLastCalledWith([
      { id: 'c1', answer: 'eher_nicht' },
    ])
  })

  it('keeps the estimate steady on Morph cards after a last high card', async () => {
    const { user } = setup(hermes)
    await user.keyboard('{Enter}{Backspace}{Enter}')
    expect(screen.getByText('Hermes eins')).toBeInTheDocument()
    expect(screen.getByText('Karte 4 von etwa 5')).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Hermes zwei')).toBeInTheDocument()
    expect(screen.getByText('Karte 5 von etwa 5')).toBeInTheDocument()
  })

  describe('swipe', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    // A 300px wide card, so the swipe threshold is 90px.
    function card() {
      const el = screen.getByTestId('deck-card')
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(
        new DOMRect(0, 0, 300, 200),
      )
      return el
    }

    function drag(el: HTMLElement, dx: number) {
      fireEvent.pointerDown(el, { pointerId: 1, clientX: 100, button: 0 })
      fireEvent.pointerMove(el, { pointerId: 1, clientX: 100 + dx })
    }

    function swipe(el: HTMLElement, dx: number) {
      drag(el, dx)
      fireEvent.pointerUp(el, { pointerId: 1, clientX: 100 + dx })
    }

    it('swiping right past the threshold answers Stimmt', async () => {
      const { onBands } = setup()
      const el = card()
      drag(el, 150)
      expect(within(el).getByText('Stimmt')).toBeInTheDocument()
      fireEvent.pointerUp(el, { pointerId: 1, clientX: 250 })
      await waitFor(() => expect(screen.getByText('Low B')).toBeInTheDocument())
      expect(onBands).toHaveBeenCalledOnce()
      expect(onBands).toHaveBeenLastCalledWith({ a: 'low' })
    })

    it('swiping left past the threshold answers Eher nicht', async () => {
      setup()
      swipe(card(), -150)
      await waitFor(() =>
        expect(screen.getByText('High A')).toBeInTheDocument(),
      )
    })

    it('a short drag springs back without answering', async () => {
      const { onBands } = setup()
      const el = card()
      swipe(el, 20)
      expect(within(el).queryByText('Stimmt')).toBeNull()
      await new Promise((r) => setTimeout(r, 400))
      expect(onBands).not.toHaveBeenCalled()
      expect(screen.getByText('Low A')).toBeInTheDocument()
      expect(el.style.transform).toBe('')
    })

    it('ignores buttons while the card flies off, so one swipe is one answer', async () => {
      const { user, onBands } = setup()
      swipe(card(), 150)
      await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
      await waitFor(() => expect(screen.getByText('Low B')).toBeInTheDocument())
      expect(onBands).toHaveBeenCalledOnce()
      expect(onBands).toHaveBeenLastCalledWith({ a: 'low' })
    })

    it('arrow keys answer while focus is in the deck, not in a field', async () => {
      const { user, onBands } = setup()
      await user.click(screen.getByLabelText('frei'))
      await user.keyboard('{ArrowRight}{ArrowLeft}')
      expect(onBands).not.toHaveBeenCalled()

      screen.getByRole('button', { name: 'Zurück' }).focus()
      await user.keyboard('{ArrowRight}')
      await waitFor(() => expect(screen.getByText('Low B')).toBeInTheDocument())
      expect(onBands).toHaveBeenLastCalledWith({ a: 'low' })
      await user.keyboard('{ArrowLeft}')
      await waitFor(() =>
        expect(screen.getByText('High B')).toBeInTheDocument(),
      )
    })

    it('answers at once, without fly-off, under reduced motion', () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({ matches: query.includes('reduce') })),
      )
      const { onBands } = setup()
      const el = card()
      drag(el, 150)
      expect(el.style.transform).not.toContain('rotate')
      fireEvent.pointerUp(el, { pointerId: 1, clientX: 250 })
      expect(onBands).toHaveBeenLastCalledWith({ a: 'low' })
      expect(screen.getByText('Low B')).toBeInTheDocument()
    })
  })

  it('hides the 30-question offer while a Hermes card is shown', async () => {
    const { user } = setup(hermes)
    await user.keyboard('{Enter}')
    expect(screen.getByText('Genauer? 30 kurze Fragen')).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Hermes eins')).toBeInTheDocument()
    expect(screen.queryByText('Genauer? 30 kurze Fragen')).toBeNull()
  })
})
