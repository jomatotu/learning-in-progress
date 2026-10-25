import { render, screen } from '@testing-library/react'
import { EmbeddedOnly, SandboxPage } from './SandboxPage'

const notFound = 'Diese Seite gibt es nicht (mehr).'

describe('SandboxPage', () => {
  it('shows the not-found card when there is no loader', () => {
    render(<SandboxPage load={undefined} />)
    expect(screen.getByText(notFound)).toBeInTheDocument()
  })

  it('renders the default export of the loaded module', async () => {
    render(
      <SandboxPage
        load={() => Promise.resolve({ default: () => <h1>Test</h1> })}
      />,
    )
    expect(await screen.findByText('Test')).toBeInTheDocument()
  })

  it('shows the not-found card when the module has no default component', async () => {
    render(<SandboxPage load={() => Promise.resolve({})} />)
    expect(await screen.findByText(notFound)).toBeInTheDocument()
  })

  it('shows a loading text while the module loads', () => {
    render(<SandboxPage load={() => new Promise(() => {})} />)
    expect(screen.getByText('Seite wird geladen …')).toBeInTheDocument()
  })

  it('shows a German error card when the page crashes', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <SandboxPage
        load={() =>
          Promise.resolve({
            default: () => {
              throw new Error('boom')
            },
          })
        }
      />,
    )
    expect(
      await screen.findByText(
        'Diese Seite hat einen Fehler. Lass Morph sie neu bauen.',
      ),
    ).toBeInTheDocument()
    spy.mockRestore()
  })

  it('shows a German error card when the module fails to load', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<SandboxPage load={() => Promise.reject(new Error('404'))} />)
    expect(
      await screen.findByText(
        'Diese Seite hat einen Fehler. Lass Morph sie neu bauen.',
      ),
    ).toBeInTheDocument()
    spy.mockRestore()
  })
})

describe('EmbeddedOnly', () => {
  it('tells the visitor to open the page from the learning page', () => {
    render(<EmbeddedOnly />)
    expect(
      screen.getByRole('heading', {
        name: 'Diese Seite läuft nur eingebettet.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Öffne sie über deine Lernseite.'),
    ).toBeInTheDocument()
  })
})
