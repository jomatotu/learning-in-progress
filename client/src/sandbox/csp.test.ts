import {
  SANDBOX_CSP,
  SANDBOX_META_CSP,
  isSandboxPath,
  withCspMeta,
} from '../../sandbox-csp'
import sandboxHtml from '../../sandbox.html?raw'

describe('isSandboxPath', () => {
  it.each([
    '/sandbox.html',
    '/sandbox.html?page=x',
    '/sandbox',
    '/sandbox/',
    '//sandbox.html',
    '/./sandbox.html',
    '/SANDBOX.HTML',
  ])('accepts %s', (url) => expect(isSandboxPath(url)).toBe(true))

  it.each(['/', '/index.html', '/sandbox.js', '/src/sandbox/main.tsx'])(
    'rejects %s',
    (url) => expect(isSandboxPath(url)).toBe(false),
  )
})

describe('sandbox CSP', () => {
  it('meta policy is the header policy without frame-ancestors', () => {
    expect(SANDBOX_CSP).toContain("frame-ancestors 'self'")
    expect(SANDBOX_META_CSP).not.toContain('frame-ancestors')
    expect(SANDBOX_CSP.startsWith(SANDBOX_META_CSP)).toBe(true)
  })

  it('puts the CSP meta first inside <head> of sandbox.html', () => {
    expect(sandboxHtml).toContain('<head>')
    const head = new DOMParser().parseFromString(
      withCspMeta(sandboxHtml),
      'text/html',
    ).head
    const first = head.firstElementChild
    expect(first?.getAttribute('http-equiv')).toBe('Content-Security-Policy')
    expect(first?.getAttribute('content')).toBe(SANDBOX_META_CSP)
  })
})
