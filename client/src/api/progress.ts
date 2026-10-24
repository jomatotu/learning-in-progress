import { useState } from 'react'
import type { StreamProgress } from '@/api/client'

// Keeps only the end of Hermes's reasoning, which is all the progress box shows.
const MAX_REASONING_CHARS = 4000

// Live progress of a streaming Hermes call: hooks pass the callbacks to streamResult and expose status and reasoning to components.
export function useStreamProgress() {
  const [status, setStatus] = useState('')
  const [reasoning, setReasoning] = useState('')
  const callbacks: StreamProgress = {
    onStatus: setStatus,
    onReasoning: (text) =>
      setReasoning((current) => (current + text).slice(-MAX_REASONING_CHARS)),
  }
  function reset() {
    setStatus('')
    setReasoning('')
  }
  return { status, reasoning, callbacks, reset }
}
