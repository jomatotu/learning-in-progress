import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { emptyProfile, type Profile } from './profile'
import { SummaryStep } from './SummaryStep'

function setup(load: () => Promise<string | null>, profile?: Partial<Profile>) {
  const update = vi.fn<(patch: Partial<Profile>) => void>()
  const onNext = vi.fn<() => void>()
  const user = userEvent.setup()
  render(
    <SummaryStep
      profile={{ ...emptyProfile, ...profile }}
      update={update}
      load={load}
      onNext={onNext}
    />,
  )
  return { user, update, onNext }
}

describe('SummaryStep', () => {
  it('waits with a note, then shows the summary to keep with Stimmt so', async () => {
    let resolve: (text: string) => void = () => {}
    const { user, update, onNext } = setup(
      () => new Promise((r) => (resolve = r)),
    )
    expect(
      screen.getByText('Hermes fasst zusammen, was es verstanden hat …'),
    ).toBeInTheDocument()

    resolve('Du magst Fußball.')
    const area = await screen.findByLabelText('Das habe ich verstanden')
    expect(area).toHaveValue('Du magst Fußball.')
    await user.click(screen.getByRole('button', { name: /stimmt so/i }))
    expect(update).toHaveBeenCalledWith({ about_you: 'Du magst Fußball.' })
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('stores the edited text', async () => {
    const { user, update } = setup(async () => 'Du magst Fußball.')
    const area = await screen.findByLabelText('Das habe ich verstanden')
    await user.clear(area)
    await user.type(area, 'Nur Musik.')
    await user.click(screen.getByRole('button', { name: /stimmt so/i }))
    expect(update).toHaveBeenCalledWith({ about_you: 'Nur Musik.' })
  })

  it('Überspringen stores nothing and moves on', async () => {
    const { user, update, onNext } = setup(async () => 'Du magst Fußball.')
    await user.click(
      await screen.findByRole('button', { name: 'Überspringen' }),
    )
    expect(update).toHaveBeenCalledWith({ about_you: '' })
    expect(onNext).toHaveBeenCalledOnce()
  })

  it.each([
    ['null', async () => null],
    ['an error', async () => Promise.reject(new Error('x'))],
  ])('shows a calm notice and Weiter on %s', async (_name, load) => {
    const { user, onNext } = setup(load)
    expect(
      await screen.findByText('Hat diesmal nicht geklappt – kein Problem.'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Das habe ich verstanden')).toBeNull()
    await user.click(screen.getByRole('button', { name: /weiter/i }))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('shows an earlier summary without asking again', () => {
    const load = vi.fn<() => Promise<string | null>>()
    setup(load, { about_you: 'Schon bestätigt.' })
    expect(screen.getByLabelText('Das habe ich verstanden')).toHaveValue(
      'Schon bestätigt.',
    )
    expect(load).not.toHaveBeenCalled()
  })

  it('moves focus to the textarea when the summary arrives', async () => {
    setup(async () => 'Du magst Fußball.')
    const area = await screen.findByLabelText('Das habe ich verstanden')
    expect(area).toHaveFocus()
  })
})
