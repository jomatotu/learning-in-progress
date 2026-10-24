import {
  SANDBOX_CSP,
  SANDBOX_META_CSP,
  isNullOriginFromSelf,
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

  it('only the header policy carries the sandbox directive', () => {
    expect(SANDBOX_CSP).toContain('; sandbox allow-scripts')
    expect(SANDBOX_META_CSP).not.toContain('sandbox')
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

describe('isNullOriginFromSelf', () => {
  const self = 'localhost:5175'

  it.each([
    'http://localhost:5175/',
    'http://localhost:5175/sandbox.html?page=x',
    'http://127.0.0.1:5175/',
  ])('accepts a sandboxed frame of our own server (referer %s)', (referer) =>
    expect(
      isNullOriginFromSelf({
        origin: 'null',
        referer,
        host: referer.includes('127') ? '127.0.0.1:5175' : self,
      }),
    ).toBe(true),
  )

  it.each([
    ['foreign referer', 'https://evil.example/', self],
    ['other port', 'http://localhost:9999/', self],
    ['garbage referer', 'not a url', self],
    ['rebinding host', 'http://evil.example:5175/', 'evil.example:5175'],
  ])('rejects %s', (_name, referer, host) =>
    expect(isNullOriginFromSelf({ origin: 'null', referer, host })).toBe(false),
  )

  it('accepts a missing referer, which Chrome omits for sandboxed module scripts', () => {
    expect(
      isNullOriginFromSelf({ origin: 'null', referer: undefined, host: self }),
    ).toBe(true)
  })

  it('rejects a real origin', () => {
    expect(
      isNullOriginFromSelf({
        origin: 'http://localhost:5175',
        referer: 'http://localhost:5175/',
        host: self,
      }),
    ).toBe(false)
  })
})
