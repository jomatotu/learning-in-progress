import { applyStoredLook } from './look'

const html = document.documentElement

afterEach(() => {
  html.removeAttribute('data-look')
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('applyStoredLook', () => {
  it('sets data-look when the stored value is on', () => {
    localStorage.setItem('lip-look', 'graustufen')
    applyStoredLook()
    expect(html).toHaveAttribute('data-look', 'graustufen')
  })

  it('removes data-look when nothing is stored', () => {
    html.setAttribute('data-look', 'graustufen')
    applyStoredLook()
    expect(html).not.toHaveAttribute('data-look')
  })

  it('does not throw and sets nothing when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => applyStoredLook()).not.toThrow()
    expect(html).not.toHaveAttribute('data-look')
  })
})
