import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import App from './App.tsx'

function renderAt(path: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('App', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => document.documentElement.classList.remove('dark'))

  it('renders the onboarding home screen', () => {
    renderAt('/')

    expect(
      screen.getByRole('heading', { name: /dein wissen/i }),
    ).toBeInTheDocument()
  })

  it('jumps into the application flow from "Los geht\'s"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        Response.json({
          version: 'test',
          response_scale: { min: 1, max: 5, labels: [] },
          categories: [],
          questions: [],
        }),
      ),
    )
    const user = userEvent.setup()
    renderAt('/')

    await user.click(screen.getByRole('button', { name: /los geht's/i }))

    expect(
      await screen.findByRole('heading', { name: /lernen wir/i }),
    ).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('renders the application form at /application', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        Response.json({
          version: 'test',
          response_scale: { min: 1, max: 5, labels: [] },
          categories: [],
          questions: [],
        }),
      ),
    )
    renderAt('/application')

    expect(
      await screen.findByRole('heading', { name: /lernen wir/i }),
    ).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('opens a demo persona filled in at the review step from /?demo=peter', async () => {
    sessionStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        Response.json({
          version: 'test',
          response_scale: { min: 1, max: 5, labels: [] },
          categories: [],
          questions: [],
          deck: [],
        }),
      ),
    )
    renderAt('/?demo=peter')

    expect(
      await screen.findByRole('heading', { name: /klingt das nach dir/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Peter')).toBeInTheDocument()
    expect(screen.getByText('Photosynthese')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /mein werkzeug bauen/i }),
    ).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('lists the three demo personas with their links at /demo', () => {
    renderAt('/demo')

    expect(
      screen.getAllByRole('link').map((link) => link.getAttribute('href')),
    ).toEqual(['/?demo=peter', '/?demo=lena', '/?demo=amir'])
  })

  it('switches the whole site to English and remembers it', async () => {
    const user = userEvent.setup()
    renderAt('/')

    await user.click(screen.getByRole('button', { name: 'Englisch' }))

    expect(
      screen.getByRole('heading', { name: /your knowledge/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /let's go/i }),
    ).toBeInTheDocument()
    expect(localStorage.getItem('language')).toBe('en')
  })

  it('switches the whole site to dark mode and remembers it', async () => {
    const user = userEvent.setup()
    renderAt('/')

    await user.click(
      screen.getByRole('button', { name: 'Zum dunklen Modus wechseln' }),
    )

    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(
      screen.getByRole('button', { name: 'Zum hellen Modus wechseln' }),
    ).toBeInTheDocument()
  })

  it('renders the build playground at /playground', () => {
    renderAt('/playground')

    expect(
      screen.getByRole('heading', { name: 'Bau-Playground' }),
    ).toBeInTheDocument()
  })
})
