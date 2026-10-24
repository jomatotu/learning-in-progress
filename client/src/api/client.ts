export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  timeoutMs?: number
}

// Sends a JSON request to /api and returns the parsed response.
export async function request<T>(
  path: string,
  { method = 'GET', body, timeoutMs = 30_000 }: RequestOptions = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('The request timed out.')
    }
    throw new ApiError('Could not reach the server.')
  }

  if (!response.ok) {
    const data: { detail?: unknown } = await response.json().catch(() => ({}))
    const message =
      typeof data.detail === 'string'
        ? data.detail
        : `Request failed with status ${response.status}.`
    throw new ApiError(message, response.status)
  }

  // Empty bodies, e.g. 204 No Content, come back as null.
  const data: T = JSON.parse((await response.text()) || 'null')
  return data
}
