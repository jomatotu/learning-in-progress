import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackBox } from './FeedbackBox'

afterEach(() => vi.unstubAllGlobals())

describe('FeedbackBox', () => {
  it('sends the wish with theme and student id, then thanks the student', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 204 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<FeedbackBox theme="chunked" />)

    await userEvent.type(
      screen.getByLabelText('Was soll Morph beim nächsten Mal anders machen?'),
      'Mehr Bilder',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Senden' }))

    expect(
      await screen.findByText('Danke! Morph denkt beim nächsten Mal daran.'),
    ).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/feedback')
    expect(JSON.parse(init?.body as string)).toEqual({
      student_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      theme: 'chunked',
      text: 'Mehr Bilder',
    })
  })
})
