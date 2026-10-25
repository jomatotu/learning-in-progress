import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useGeneratePage, type GenerateInput } from './generate'

const input: GenerateInput = {
  profile: {
    name: 'Peter',
    challenges: ['ADHD'],
    goals: '',
    interests: [],
  },
  answers: [{ question: 'Reading or doing?', answer: 'Doing' }],
  material: 'Osmosis',
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

describe('useGeneratePage', () => {
  it('posts the input, reports progress, and returns the page', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        sse(
          ['status', { text: 'Thinking…' }],
          ['reasoning', { text: 'First the ' }],
          ['reasoning', { text: 'research.' }],
          ['done', { html: '<!doctype html><html></html>' }],
        ),
      )
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useGeneratePage(), { wrapper })

    act(() => result.current.mutate(input))

    await waitFor(() =>
      expect(result.current.data).toEqual({
        html: '<!doctype html><html></html>',
      }),
    )
    expect(result.current.status).toBe('Thinking…')
    expect(result.current.reasoning).toBe('First the research.')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/generate')
    const sent = fetchMock.mock.calls[0][1]?.body
    expect(JSON.parse(typeof sent === 'string' ? sent : '{}')).toEqual({
      ...input,
      student_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
    })
  })

  it('fails with the message from an error event', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          sse([
            'error',
            { message: 'Morph antwortet gerade nicht. Versuch es nochmal.' },
          ]),
        ),
    )
    const { result } = renderHook(() => useGeneratePage(), { wrapper })

    act(() => result.current.mutate(input))

    await waitFor(() =>
      expect(result.current.error?.message).toBe(
        'Morph antwortet gerade nicht. Versuch es nochmal.',
      ),
    )
  })

  it('fails when the stream ends without a page', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(sse(['status', { text: 'Thinking…' }])),
    )
    const { result } = renderHook(() => useGeneratePage(), { wrapper })

    act(() => result.current.mutate(input))

    await waitFor(() =>
      expect(result.current.error?.message).toBe(
        'Der Server hat vor dem Ende aufgehört.',
      ),
    )
  })
})
