import { request } from '@/api/client'

export type HermesCard = {
  id: string
  text: string
  yes: string | null
  no: string | null
}

export type CardAnswer = { id: string; answer: 'stimmt' | 'eher_nicht' }

// What Hermes gets to read: the five things the student has told us so far.
export type IntakeBody = {
  student: Record<string, unknown>
  goal: Record<string, unknown>
  topic: string
  preferences: Record<string, unknown>
}

export type SummaryBody = {
  token: string
  bands: Record<string, string>
  card_answers: CardAnswer[]
}

export function requestCards(
  body: IntakeBody,
): Promise<{ token: string; cards: HermesCard[] }> {
  return request('/intake/cards', {
    method: 'POST',
    body,
    timeoutMs: 70_000,
  })
}

export function requestSummary(
  body: SummaryBody,
): Promise<{ about_you: string | null }> {
  return request('/intake/summary', {
    method: 'POST',
    body,
    timeoutMs: 40_000,
  })
}
