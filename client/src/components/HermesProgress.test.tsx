import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HermesProgress, formatElapsed } from './HermesProgress'

afterEach(() => {
  vi.useRealTimers()
  sessionStorage.clear()
})

describe('HermesProgress', () => {
  it('shows only the friendly line until the student asks to watch', () => {
    render(
      <HermesProgress
        status="Schreibe Dateien…"
        reasoning="First the research."
      />,
    )

    expect(screen.getByText('Morph formt deine Seite…')).toBeInTheDocument()
    expect(screen.queryByText('Schreibe Dateien…')).not.toBeInTheDocument()
    expect(screen.queryByText('First the research.')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Morph bei der Arbeit zusehen' }),
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the raw status, time and reasoning, and remembers it for the session', async () => {
    const { unmount } = render(
      <HermesProgress
        status="Schreibe Dateien…"
        reasoning="First the research."
      />,
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Morph bei der Arbeit zusehen' }),
    )

    expect(screen.getByText('Schreibe Dateien…')).toBeInTheDocument()
    expect(screen.getByText('0:00')).toBeInTheDocument()
    expect(screen.getByLabelText('Hermes denkt')).toHaveTextContent(
      'First the research.',
    )
    expect(screen.getByRole('button', { name: 'Ausblenden' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    unmount()
    render(<HermesProgress status="" reasoning="" />)
    expect(screen.getByText('Wird gestartet …')).toBeInTheDocument()
  })

  it('counts the time from the start, even when opened later', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    render(<HermesProgress status="" reasoning="" />)
    act(() => {
      void vi.advanceTimersByTime(83_000)
    })

    await userEvent.click(
      screen.getByRole('button', { name: 'Morph bei der Arbeit zusehen' }),
    )

    expect(screen.getByText('1:23')).toBeInTheDocument()
  })

  it('shows the morphing dot only when asked', () => {
    const { rerender } = render(<HermesProgress status="" reasoning="" shape />)
    expect(
      screen.getByRole('img', { name: 'Morph arbeitet' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Morph liest deinen Text…')).toBeInTheDocument()

    rerender(<HermesProgress status="" reasoning="" step={2} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Fast fertig…')).toBeInTheDocument()
  })
})

describe('formatElapsed', () => {
  it('formats milliseconds as m:ss', () => {
    expect(formatElapsed(0)).toBe('0:00')
    expect(formatElapsed(9_999)).toBe('0:09')
    expect(formatElapsed(488_000)).toBe('8:08')
  })
})
