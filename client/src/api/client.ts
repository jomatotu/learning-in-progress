import { currentLang, defineMessages } from '@/lib/i18n'

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

const messages = defineMessages({
  en: {
    askCode: 'Access code for Morph',
    failed: (status: number) => `Request failed with status ${status}.`,
    stopped: 'The server stopped before it was done.',
    timeout: 'That took too long. Try again in a moment.',
    unreachable: 'The server can’t be reached right now.',
  },
  de: {
    askCode: 'Zugangscode für Morph',
    failed: (status: number) =>
      `Die Anfrage ist fehlgeschlagen (Status ${status}).`,
    stopped: 'Der Server hat vor dem Ende aufgehört.',
    timeout: 'Das hat zu lange gedauert. Versuch es gleich nochmal.',
    unreachable: 'Der Server ist gerade nicht erreichbar.',
  },
})

const t = () => messages[currentLang()]

const ACCESS_KEY = 'lip-access-code'

// The shared access code, kept in this browser so the student types it once. Hermes-written pages run in an
// opaque-origin sandbox and can't read it.
function storedCode(): string {
  try {
    return localStorage.getItem(ACCESS_KEY) ?? ''
  } catch {
    return ''
  }
}

function accessHeader(): Record<string, string> {
  const code = storedCode()
  if (!code) return {}
  const bytes = new TextEncoder().encode(`x:${code}`)
  return {
    Authorization: `Basic ${btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))}`,
  }
}

// Asks for the code after a 401 and keeps it; false when the student cancels.
function askForCode(): boolean {
  const code = window.prompt(t().askCode)?.trim()
  if (!code) return false
  try {
    localStorage.setItem(ACCESS_KEY, code)
  } catch {
    // Storage blocked: the code still works for this retry.
  }
  return true
}

// fetch with the access code; one retry after asking for it when the server says it's missing or wrong.
async function fetchWithAccess(
  url: string,
  {
    headers,
    ...init
  }: Omit<RequestInit, 'headers'> & { headers: Record<string, string> },
): Promise<Response> {
  const send = () =>
    fetch(url, { ...init, headers: { ...headers, ...accessHeader() } })
  const response = await send()
  return response.status === 401 && askForCode() ? send() : response
}

// Sends a JSON request to /api and returns the parsed response.
export async function request<T>(
  path: string,
  { method = 'GET', body, timeoutMs = 30_000 }: RequestOptions = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetchWithAccess(`/api${path}`, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    throw toApiError(error)
  }

  if (!response.ok) {
    const data: { detail?: unknown } = await response.json().catch(() => ({}))
    const message =
      typeof data.detail === 'string'
        ? data.detail
        : t().failed(response.status)
    throw new ApiError(message, response.status)
  }

  // Empty bodies, e.g. 204 No Content, come back as null.
  const data: T = JSON.parse((await response.text()) || 'null')
  return data
}

export type StreamOptions = {
  body: unknown
  timeoutMs?: number
  onEvent: (event: string, data: unknown) => void
}

// POSTs JSON to /api and calls onEvent for each server-sent event, for endpoints that report progress while they work.
// Resolves when the server closes the stream; errors thrown by onEvent stop reading and reject.
export async function streamRequest(
  path: string,
  { body, timeoutMs = 900_000, onEvent }: StreamOptions,
): Promise<void> {
  let response: Response
  try {
    response = await fetchWithAccess(`/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    throw toApiError(error)
  }

  if (!response.ok || !response.body) {
    const data: { detail?: unknown } = await response.json().catch(() => ({}))
    const message =
      typeof data.detail === 'string'
        ? data.detail
        : t().failed(response.status)
    throw new ApiError(message, response.status)
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return
      buffer += value
      // Events are separated by a blank line; keep any unfinished one for the next read.
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() ?? ''
      for (const block of blocks) {
        const lines = block.split('\n')
        const event = lines.find((line) => line.startsWith('event: '))
        const data = lines.find((line) => line.startsWith('data: '))
        if (event && data) onEvent(event.slice(7), JSON.parse(data.slice(6)))
      }
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw toApiError(error)
  } finally {
    reader.releaseLock()
  }
}

// Callbacks for the live progress a streaming endpoint sends while it works.
export type StreamProgress = {
  // The current step, e.g. a tool Hermes is running.
  onStatus: (text: string) => void
  // The next chunk of Hermes's reasoning, to append to what came before.
  onReasoning?: (text: string) => void
  // The page written so far, as a renderable document.
  onPreview?: (html: string) => void
}

// Streams an endpoint that sends "status" and "reasoning" events while it works, then "done" with the result or "error" with a message.
// Passes the progress events to the callbacks and resolves with the data of the "done" event.
export async function streamResult<T>(
  path: string,
  {
    body,
    timeoutMs,
    onStatus,
    onReasoning,
    onPreview,
  }: { body: unknown; timeoutMs?: number } & StreamProgress,
): Promise<T> {
  let result: { data: T } | undefined
  await streamRequest(path, {
    body,
    timeoutMs,
    onEvent: (event, data) => {
      if (event === 'status') onStatus((data as { text: string }).text)
      if (event === 'reasoning') onReasoning?.((data as { text: string }).text)
      if (event === 'preview') onPreview?.((data as { html: string }).html)
      if (event === 'done') result = { data: data as T }
      if (event === 'error') {
        throw new ApiError((data as { message: string }).message)
      }
    },
  })
  if (!result) throw new ApiError(t().stopped)
  return result.data
}

function toApiError(error: unknown): ApiError {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return new ApiError(t().timeout)
  }
  return new ApiError(t().unreachable)
}
