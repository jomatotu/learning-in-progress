// Policy for sandbox.html, defined once. It is sent as a header (adds
// frame-ancestors) and injected as a <meta> first in <head>, so the limits
// also hold when the document is reached under another URL (e.g. /sandbox).
// connect-src allows only the HMR websocket, so the frame cannot call /api.
// 'unsafe-inline' scripts are for the dev React-refresh preamble.
// Production hosting must send the header for the sandbox document too.
export const SANDBOX_META_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src ws://localhost:*; form-action 'none'; base-uri 'none'; object-src 'none'"

// `sandbox` is header-only (a meta policy ignores it): opening the document directly is sandboxed too.
export const SANDBOX_CSP = `${SANDBOX_META_CSP}; frame-ancestors 'self'; sandbox allow-scripts`

// Matches /sandbox.html however it is spelled: query, extra slashes, ./ segments, case, no extension.
export function isSandboxPath(url: string): boolean {
  const path = url
    .split(/[?#]/)[0]
    .toLowerCase()
    .replace(/\/(\.\/)+/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/\/$/, '')
  return path === '/sandbox.html' || path === '/sandbox'
}

export function withCspMeta(html: string): string {
  return html.replace(
    '<head>',
    `<head>\n    <meta http-equiv="Content-Security-Policy" content="${SANDBOX_META_CSP}" />`,
  )
}

// True for a request made by our own sandboxed frame: opaque origin 'null' whose
// Referer is this dev server (loopback host only, so DNS rebinding does not count).
export function isNullOriginFromSelf(request: {
  origin?: string
  referer?: string
  host?: string
}): boolean {
  if (request.origin !== 'null' || !request.referer || !request.host) {
    return false
  }
  try {
    const referer = new URL(request.referer)
    return (
      referer.host === request.host &&
      ['localhost', '127.0.0.1'].includes(referer.hostname)
    )
  } catch {
    return false
  }
}
