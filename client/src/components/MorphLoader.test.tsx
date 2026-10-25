import { render, screen } from '@testing-library/react'
import { MorphLoader, shapeAt } from './MorphLoader'

describe('MorphLoader', () => {
  it('starts as a dot, morphs away from it, and comes back to it at the end of the loop', () => {
    const dot = shapeAt(0)
    expect(dot.strokes.flat().every(([x, y]) => x === 50 && y === 50)).toBe(
      true,
    )
    expect(shapeAt(2700).strokes).not.toEqual(dot.strokes)
    expect(shapeAt(5 * 1800).strokes).toEqual(dot.strokes)
  })

  it('blends shapes with the same number of points', () => {
    const counts = [0, 2000, 4000, 6000, 8000].map((ms) =>
      shapeAt(ms).strokes.map((stroke) => stroke.length),
    )
    expect(new Set(counts.flat())).toEqual(new Set([8]))
  })

  it('shows the dot and one friendly line', () => {
    render(<MorphLoader step={0} />)

    expect(
      screen.getByRole('img', { name: 'Morph arbeitet' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Morph liest deinen Text…')).toBeInTheDocument()
  })
})
