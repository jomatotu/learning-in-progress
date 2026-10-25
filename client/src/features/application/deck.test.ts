import type { DeckEntry } from '@/lib/survey'
import type { HermesCard } from '@/api/intake'
import { nextDeckState, nextHermesCard, type DeckState } from './deck'

const card = { text: 't', reason: 'Deshalb r' }
const deck: DeckEntry[] = ['a', 'b'].map((category) => ({
  category,
  title: category,
  low: card,
  medium: { text: 'm' },
  high: card,
}))
const start: DeckState = { index: 0, asked: 'low', bands: {} }

describe('nextDeckState', () => {
  it('low + stimmt sets low and moves to the next category', () => {
    expect(nextDeckState(start, 'stimmt', deck)).toEqual({
      index: 1,
      asked: 'low',
      bands: { a: 'low' },
    })
  })

  it('low + eher_nicht asks the high card of the same category', () => {
    expect(nextDeckState(start, 'eher_nicht', deck)).toEqual({
      index: 0,
      asked: 'high',
      bands: {},
    })
  })

  it('high + stimmt sets high, high + eher_nicht sets medium', () => {
    const high: DeckState = { index: 0, asked: 'high', bands: {} }
    expect(nextDeckState(high, 'stimmt', deck)).toMatchObject({
      index: 1,
      bands: { a: 'high' },
    })
    expect(nextDeckState(high, 'eher_nicht', deck)).toMatchObject({
      index: 1,
      asked: 'low',
      bands: { a: 'medium' },
    })
  })

  it('weiss_nicht leaves the category unset, even if it had a band before', () => {
    const state: DeckState = { index: 0, asked: 'low', bands: { a: 'low' } }
    expect(nextDeckState(state, 'weiss_nicht', deck)).toEqual({
      index: 1,
      asked: 'low',
      bands: {},
    })
  })

  it('is done after the last category', () => {
    const last: DeckState = { index: 1, asked: 'low', bands: { a: 'low' } }
    expect(nextDeckState(last, 'stimmt', deck)).toBe('done')
  })

  it('does not change the state it was given', () => {
    const frozen = Object.freeze({ ...start, bands: Object.freeze({}) })
    expect(() => nextDeckState(frozen, 'stimmt', deck)).not.toThrow()
    expect(start.bands).toEqual({})
  })
})

describe('nextHermesCard', () => {
  const cards: HermesCard[] = [
    { id: 'c1', text: 'a', yes: 'c2', no: null },
    { id: 'c2', text: 'b', yes: null, no: null },
  ]

  it('follows yes on stimmt', () => {
    expect(nextHermesCard(cards, 'c1', 'stimmt')).toBe('c2')
  })

  it('follows no on eher_nicht; a null branch ends', () => {
    expect(nextHermesCard(cards, 'c1', 'eher_nicht')).toBe('done')
  })

  it('ends on weiss_nicht even when a branch exists', () => {
    expect(nextHermesCard(cards, 'c1', 'weiss_nicht')).toBe('done')
  })

  it('ends on an unknown id', () => {
    expect(nextHermesCard(cards, 'c9', 'stimmt')).toBe('done')
  })
})
