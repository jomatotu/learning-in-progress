import { currentLang, defineMessages } from '@/lib/i18n'

// Texts for the error codes the server's guards send, in both languages.
const guardMessages = defineMessages<Record<string, string>>({
  en: {
    access_required: 'Please sign in with the access code.',
    too_many_requests:
      'Too many requests right now. Wait a minute and try again.',
    access_not_configured:
      'The server isn’t set up yet: ACCESS_CODE is missing in server/.env.',
  },
  de: {
    access_required: 'Bitte melde dich mit dem Zugangscode an.',
    too_many_requests:
      'Gerade zu viele Anfragen. Warte eine Minute und versuch es nochmal.',
    access_not_configured:
      'Der Server ist noch nicht eingerichtet: ACCESS_CODE fehlt in server/.env.',
  },
})

// The text to show for a failed API call: a translated text for guard codes, else the error's own message (or `fallback`).
export function errorMessage(error: unknown, fallback?: string): string {
  if (!(error instanceof Error)) return fallback ?? ''
  return (
    guardMessages[currentLang()][error.message] ?? fallback ?? error.message
  )
}
