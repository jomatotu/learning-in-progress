import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Spec } from '@json-render/core'
import { LessonView } from './LessonView'

// jsdom has no WebGL; the lazy-loaded canvas is replaced by a stub.
vi.mock('./SceneCanvas', () => ({
  default: ({ parts }: { parts: { label: string }[] }) => (
    <div data-testid="scene-canvas">{parts.length} Teile</div>
  ),
}))

const scene: Spec = {
  root: 'lesson',
  elements: {
    lesson: {
      type: 'Lesson',
      props: { title: 'Fotosynthese' },
      children: ['scene'],
    },
    scene: {
      type: 'Scene3D',
      props: {
        title: 'Ein Chloroplast',
        parts: [
          {
            label: 'Thylakoid',
            shape: 'cylinder',
            position: [0, 0, 0],
            size: 1,
            color: '#4caf50',
            text: 'In den Thylakoiden wird Licht eingefangen.',
          },
          {
            label: 'Stroma',
            shape: 'sphere',
            position: [1.5, 0, 0],
            size: 1.2,
            color: '#c5e1a5',
            text: 'Im Stroma entsteht Zucker.',
          },
        ],
        source: 'In den Thylakoiden wird Licht eingefangen.',
      },
      children: [],
    },
  },
}

describe('Scene3D', () => {
  it('loads the 3D canvas lazily and shows a part’s sentence when its label is picked', async () => {
    render(<LessonView spec={scene} />)

    expect(await screen.findByTestId('scene-canvas')).toHaveTextContent(
      '2 Teile',
    )
    expect(
      screen.getByRole('heading', { name: 'Ein Chloroplast' }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Stroma' }))

    expect(screen.getByRole('button', { name: 'Stroma' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText('Im Stroma entsteht Zucker.')).toBeVisible()
  })
})
