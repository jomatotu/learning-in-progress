import { render, screen } from '@testing-library/react'
import App from './App.tsx'

describe('App', () => {
  it('shows the project name', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Learning in Progress' }),
    ).toBeInTheDocument()
  })
})
