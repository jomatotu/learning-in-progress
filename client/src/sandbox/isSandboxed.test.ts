import { isSandboxed } from './isSandboxed'

describe('isSandboxed', () => {
  it('is true for the opaque origin of a sandboxed frame', () => {
    expect(isSandboxed('null')).toBe(true)
  })

  it.each(['http://localhost:5175', 'https://example.com', ''])(
    'is false for %s',
    (origin) => expect(isSandboxed(origin)).toBe(false),
  )
})
