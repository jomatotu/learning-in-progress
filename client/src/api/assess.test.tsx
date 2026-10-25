import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAssess, type AssessInput } from './assess'

const input: AssessInput = {
  profile: {
    name: 'Peter',
    challenges: ['ADHD'],
    goals: '',
    interests: [],
  },
  answers: [],
  material: 'Fractions',
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  )
}

function sse(...events: [string, unknown][]) {
  return new Response(
    events
      .map(
        ([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
      )
      .join(''),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useAssess', () => {
  it('posts the input, reports progress, and returns the next question', async () => {
    const question = {
      done: false,
      question: 'Morning or evening?',
      options: ['Morning', 'Evening'],
      themes: [],
    }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      sse(
        [
          'status',
          {
            text: 'Morph denkt über deine Antworten nach… ~20 Wörter gedacht',
          },
        ],
        ['done', question],
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useAssess(), { wrapper })

    act(() => result.current.mutate(input))

    await waitFor(() => expect(result.current.data).toEqual(question))
    expect(result.current.status).toBe(
      'Morph denkt über deine Antworten nach… ~20 Wörter gedacht',
    )
    expect(fetchMock.mock.calls[0][0]).toBe('/api/assess')
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({
      ...input,
      student_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
    })
  })

  it('returns the picked themes when done', async () => {
    const finished = {
      done: true,
      question: '',
      options: [],
      themes: [{ theme: 'read-aloud', reason: 'Listening works for you.' }],
    }
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(sse(['done', finished])),
    )
    const { result } = renderHook(() => useAssess(), { wrapper })

    act(() => result.current.mutate(input))

    await waitFor(() => expect(result.current.data).toEqual(finished))
  })

  it('fails with the message from an error event', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          sse([
            'error',
            { message: 'Morph hat nicht geantwortet. Versuch es nochmal.' },
          ]),
        ),
    )
    const { result } = renderHook(() => useAssess(), { wrapper })

    act(() => result.current.mutate(input))

    await waitFor(() =>
      expect(result.current.error?.message).toBe(
        'Morph hat nicht geantwortet. Versuch es nochmal.',
      ),
    )
  })
})
