import { ApiError } from './client'
import { errorMessage } from './errorMessage'

describe('errorMessage', () => {
  it.each([
    ['access_required', 'Bitte melde dich mit dem Zugangscode an.'],
    [
      'too_many_requests',
      'Gerade zu viele Anfragen. Warte eine Minute und versuch es nochmal.',
    ],
    [
      'access_not_configured',
      'Der Server ist noch nicht eingerichtet: ACCESS_CODE fehlt in server/.env.',
    ],
  ])('maps %s to German', (code, text) => {
    expect(errorMessage(new ApiError(code, 401))).toBe(text)
  })

  it('keeps other messages as they are', () => {
    expect(errorMessage(new ApiError('Could not reach the server.'))).toBe(
      'Could not reach the server.',
    )
  })

  it('uses the fallback for non-Error values', () => {
    expect(errorMessage('x', 'Fallback')).toBe('Fallback')
  })
})
