import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.tsx'

describe('App', () => {
  it('renders the onboarding home screen', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /dein wissen/i }),
    ).toBeInTheDocument()
  })

  it('walks through the first onboarding question', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /los geht's/i }))

    expect(screen.getByText(/wann fühlt sich lernen/i)).toBeInTheDocument()
  })
})
