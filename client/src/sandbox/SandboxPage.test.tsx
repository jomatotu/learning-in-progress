import { render, screen } from '@testing-library/react'
import { SandboxPage } from './SandboxPage'

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
})
