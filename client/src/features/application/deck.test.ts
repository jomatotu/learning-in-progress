import type { DeckEntry } from '@/lib/survey'
import { nextDeckState, type DeckState } from './deck'

const card = { text: 't', reason: 'Deshalb r' }
const deck: DeckEntry[] = ['a', 'b'].map((category) => ({
  category,
  title: category,
  low: card,
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
