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
    whatWorks: '',
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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useAssess', () => {
  it('posts the input and returns the next question', async () => {
    const question = {
      done: false,
      question: 'Morning or evening?',
      options: ['Morning', 'Evening'],
    }
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(question)))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useAssess(), { wrapper })

    act(() => result.current.mutate(input))

    await waitFor(() => expect(result.current.data).toEqual(question))
    expect(fetchMock.mock.calls[0][0]).toBe('/api/assess')
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify(input))
  })
})
