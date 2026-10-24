import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { SolutionRoute } from './SolutionRoute'
import source from './SolutionRoute.tsx?raw'

describe('SolutionRoute', () => {
  it('shows the page in a script-only sandboxed frame', () => {
    render(
      <MemoryRouter initialEntries={['/solution/abc']}>
        <Routes>
          <Route path="/solution/:uuid" element={<SolutionRoute />} />
        </Routes>
      </MemoryRouter>,
    )
    const frame = screen.getByTitle('Deine Lernseite')
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts')
    expect(frame.getAttribute('src')).toBe('/sandbox.html?page=abc')
  })

  it('never imports generated code into the app bundle', () => {
    expect(source).not.toContain('import.meta.glob')
  })
})
