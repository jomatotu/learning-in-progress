import { ApiError, request } from './client'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

function stubFetch() {
  const fetchMock = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('request', () => {
  it('returns the parsed JSON response', async () => {
    stubFetch().mockResolvedValue(json({ ok: true }))

    expect(await request('/thing')).toEqual({ ok: true })
  })

  it('returns null for an empty response', async () => {
    stubFetch().mockResolvedValue(new Response(null, { status: 204 }))

    expect(await request('/thing', { method: 'DELETE' })).toBeNull()
  })

  it('throws the server detail message on errors', async () => {
    stubFetch().mockResolvedValue(json({ detail: 'Bad input' }, 400))

    await expect(request('/thing')).rejects.toEqual(
      new ApiError('Bad input', 400),
    )
  })

  it('times out slow requests', async () => {
    stubFetch().mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Timed out', 'TimeoutError')),
          )
        }),
    )

    await expect(request('/thing', { timeoutMs: 10 })).rejects.toEqual(
      new ApiError('The request timed out.'),
    )
  })

  it('reports an unreachable server', async () => {
    stubFetch().mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(request('/thing')).rejects.toEqual(
      new ApiError('Could not reach the server.'),
    )
  })
})
