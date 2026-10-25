import { requestCards, requestSummary } from './intake'

afterEach(() => vi.unstubAllGlobals())

function stubFetch(body: unknown) {
  const fetchMock = vi.fn<typeof fetch>(async () => Response.json(body))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('intake api', () => {
  it('posts the intake body to /api/intake/cards and returns token and cards', async () => {
    const fetchMock = stubFetch({ token: 't', cards: [] })
    const body = { student: {}, goal: {}, topic: 'x', preferences: {} }
    await expect(requestCards(body)).resolves.toEqual({
      token: 't',
      cards: [],
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/intake/cards')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({
      ...body,
      student_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
    })
  })

  it('posts token, bands and card answers to /api/intake/summary', async () => {
    const fetchMock = stubFetch({ about_you: 'Du magst Fußball.' })
    const body = {
      token: 't',
      bands: { a: 'low' },
      card_answers: [{ id: 'c1', answer: 'stimmt' as const }],
    }
    await expect(requestSummary(body)).resolves.toEqual({
      about_you: 'Du magst Fußball.',
    })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/intake/summary')
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({
      ...body,
      student_id: expect.any(String),
    })
  })
})
