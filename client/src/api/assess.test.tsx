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
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        sse(
          ['status', { text: 'Thinking about your answers… ~20 tokens' }],
          ['done', question],
        ),
      )
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useAssess(), { wrapper })

    act(() => result.current.mutate(input))

    await waitFor(() => expect(result.current.data).toEqual(question))
    expect(result.current.status).toBe(
      'Thinking about your answers… ~20 tokens',
    )
    expect(fetchMock.mock.calls[0][0]).toBe('/api/assess')
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify(input))
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
          sse(['error', { message: "Hermes didn't answer. Try again." }]),
        ),
    )
    const { result } = renderHook(() => useAssess(), { wrapper })

    act(() => result.current.mutate(input))

    await waitFor(() =>
      expect(result.current.error?.message).toBe(
        "Hermes didn't answer. Try again.",
      ),
    )
  })
})
