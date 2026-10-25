import type { DeckEntry } from '@/lib/survey'

export type Band = 'low' | 'medium' | 'high'
export type DeckAnswer = 'stimmt' | 'eher_nicht' | 'weiss_nicht'

// Which category is asked, whether its low or high card is showing, and the bands chosen so far.
export type DeckState = {
  index: number
  asked: 'low' | 'high'
  bands: Record<string, Band>
}

// The bands after one answer: low "stimmt" = low; "eher nicht" on low asks high; high "stimmt" = high,
// high "eher nicht" = medium; "weiß nicht" leaves the category unset.
export function answerBands(
  state: DeckState,
  answer: DeckAnswer,
  deck: DeckEntry[],
): Record<string, Band> {
  const category = deck[state.index].category
  const rest = Object.fromEntries(
    Object.entries(state.bands).filter(([id]) => id !== category),
  )
  if (answer === 'weiss_nicht') return rest
  if (state.asked === 'low') {
    return answer === 'stimmt' ? { ...rest, [category]: 'low' } : rest
  }
  return { ...rest, [category]: answer === 'stimmt' ? 'high' : 'medium' }
}

export function nextDeckState(
  state: DeckState,
  answer: DeckAnswer,
  deck: DeckEntry[],
): DeckState | 'done' {
  const bands = answerBands(state, answer, deck)
  if (state.asked === 'low' && answer === 'eher_nicht') {
    return { ...state, asked: 'high', bands }
  }
  const index = state.index + 1
  return index >= deck.length ? 'done' : { index, asked: 'low', bands }
}
