// German texts for the error codes the server's guards send.
const guardMessages: Record<string, string> = {
  access_required: 'Bitte melde dich mit dem Zugangscode an.',
  too_many_requests:
    'Gerade zu viele Anfragen. Warte eine Minute und versuch es nochmal.',
  access_not_configured:
    'Der Server ist noch nicht eingerichtet: ACCESS_CODE fehlt in server/.env.',
}

// The text to show for a failed API call: German for guard codes, else the error's own message (or `fallback`).
export function errorMessage(error: unknown, fallback?: string): string {
  if (!(error instanceof Error)) return fallback ?? ''
  return guardMessages[error.message] ?? fallback ?? error.message
}
