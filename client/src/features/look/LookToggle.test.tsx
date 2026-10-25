import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ApplicationPage } from '../application/ApplicationPage'
import { LookToggle } from './LookToggle'

const html = document.documentElement

afterEach(() => {
  html.removeAttribute('data-look')
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('LookToggle', () => {
  it('toggles data-look on <html> and aria-pressed', async () => {
    const user = userEvent.setup()
    render(<LookToggle />)
    const button = screen.getByRole('button', { name: 'Graustufen' })
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(html).toHaveAttribute('data-look', 'graustufen')
    expect(localStorage.getItem('lip-look')).toBe('graustufen')

    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(html).not.toHaveAttribute('data-look')
  })

  it('restores the stored choice on mount', () => {
    localStorage.setItem('lip-look', 'graustufen')
    render(<LookToggle />)
    expect(screen.getByRole('button', { name: 'Graustufen' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(html).toHaveAttribute('data-look', 'graustufen')
  })

  it('still toggles when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    render(<LookToggle />)
    const button = screen.getByRole('button', { name: 'Graustufen' })
    await userEvent.setup().click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(html).toHaveAttribute('data-look', 'graustufen')
  })
})

describe('ApplicationPage', () => {
  it('has the Graustufen toggle and no reading-comfort controls', () => {
    render(
      <MemoryRouter>
        <ApplicationPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Graustufen' })).toBeVisible()
    for (const old of ['Larger text', 'More spacing', 'Calmer colours']) {
      expect(screen.queryByText(old)).toBeNull()
    }
  })
})
