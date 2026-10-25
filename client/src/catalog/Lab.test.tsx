import { fireEvent, render, screen } from '@testing-library/react'
import type { Spec } from '@json-render/core'
import { LessonView } from './LessonView'
import { effect } from './labModel'

const lab: Spec = {
  root: 'lesson',
  elements: {
    lesson: {
      type: 'Lesson',
      props: { title: 'Fotosynthese' },
      children: ['lab'],
    },
    lab: {
      type: 'Lab',
      props: {
        title: 'Licht und CO2',
        sliders: [
          {
            key: 'licht',
            label: 'Lichtstärke',
            unit: '%',
            min: 0,
            max: 100,
            step: 1,
            value: 10,
            effect: 'saturating',
            k: 30,
          },
          {
            key: 'co2',
            label: 'CO2',
            unit: 'ppm',
            min: 0,
            max: 1000,
            step: 10,
            value: 400,
            effect: 'linear',
          },
        ],
        output: { label: 'Fotosyntheserate', unit: '%', max: 100 },
        notes: [
          { upTo: 20, text: 'Bei wenig Licht fehlt Energie.' },
          { upTo: 100, text: 'Viel Licht: jetzt bremst das CO2.' },
        ],
        source: 'Die Rate hängt von Licht und CO2 ab.',
      },
      children: [],
    },
  },
}

describe('Lab', () => {
  it('shows a slider per factor, a chart, and updates output and note when a slider moves', () => {
    render(<LessonView spec={lab} />)

    const light = screen.getByRole('slider', { name: /Lichtstärke/ })
    expect(screen.getByRole('slider', { name: /CO2/ })).toHaveValue('400')
    expect(screen.getByTestId('lab-chart')).toBeVisible()
    expect(screen.getByText('Bei wenig Licht fehlt Energie.')).toBeVisible()
    const before = screen.getByTestId('lab-output').textContent

    fireEvent.change(light, { target: { value: '80' } })

    expect(screen.getByText('Viel Licht: jetzt bremst das CO2.')).toBeVisible()
    expect(screen.getByTestId('lab-output').textContent).not.toBe(before)
  })

  it.each([
    ['linear', 50, 0.5],
    ['saturating', 100, 1],
    ['optimum', 50, 1],
  ] as const)('%s effect at %d gives %d', (kind, x, expected) => {
    const slider = {
      min: 0,
      max: 100,
      effect: kind,
      k: kind === 'optimum' ? 50 : 20,
    }
    expect(effect(slider, x)).toBeCloseTo(expected)
    expect(effect(slider, 0)).toBeLessThan(effect(slider, x) + 1e-9)
  })
})
