import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MagicStep } from './MagicStep'
import type { StudentProfileJson } from './studentProfile'

afterEach(() => vi.unstubAllGlobals())

describe('MagicStep', () => {
  it('tells the student to sign in when the server answers access_required', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        Response.json({ detail: 'access_required' }, { status: 401 }),
      ),
    )
    render(
      <MagicStep topic="Bruchrechnen" profileJson={{} as StudentProfileJson} />,
    )

    await userEvent.setup().click(screen.getByRole('button'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Bitte melde dich mit dem Zugangscode an.',
    )
  })
})
